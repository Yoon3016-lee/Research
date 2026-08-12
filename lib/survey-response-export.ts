import "server-only";

import * as XLSX from "xlsx";
import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { fetchAllPages, fetchAllSurveyResponseAnswers } from "@/lib/supabase-paginate";
import {
  clampLikertScaleSize,
  isLikertScaleValue,
  likertScaleValues,
} from "@/lib/likert-scale";
import {
  isStarRatingValue,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/survey-types";

export type SurveyResponseExportResult =
  | {
      ok: true;
      slug: string;
      title: string;
      buffer: Buffer;
      filename: string;
    }
  | { ok: false; reason: "not_configured" | "not_found" };

type SurveyRow = { id: string; slug: string; title: string };

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  max_selections: number | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
  is_other?: boolean | null;
};

type ResponseRow = {
  id: string;
  submitted_at: string;
};

type AnswerRow = {
  response_id: string;
  question_id: string;
  answer: unknown;
};

export type QuestionExportMeta = {
  questionId: string;
  questionNumber: number;
  orderIndex: number;
  prompt: string;
  type: QuestionType;
  typeLabel: string;
  scaleSize: number;
  options: { id: string; index: number; label: string; isOther?: boolean }[];
};

export type ResponseExportRow = {
  responseNumber: number;
  submittedAt: string;
  answers: Map<string, { code: string; label: string }>;
};

type ExportDataset = {
  slug: string;
  title: string;
  questions: QuestionExportMeta[];
  responses: ResponseExportRow[];
};

async function fetchSurveyByRef(ref: string): Promise<SurveyRow | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  const select = "id, slug, title";
  const bySlug = await admin.from("surveys").select(select).eq("slug", normalized).maybeSingle();
  if (bySlug.data) return bySlug.data as SurveyRow;
  if (bySlug.error) {
    console.error("[survey-response-export] slug:", bySlug.error.message);
    return null;
  }

  if (isUuid(normalized)) {
    const byId = await admin.from("surveys").select(select).eq("id", normalized).maybeSingle();
    if (byId.data) return byId.data as SurveyRow;
    if (byId.error) {
      console.error("[survey-response-export] id:", byId.error.message);
    }
  }

  return null;
}

function parseMcSingle(answer: unknown): string | null {
  if (!answer || typeof answer !== "object") return null;
  const id = (answer as { optionId?: string }).optionId;
  return id?.trim() ? id : null;
}

function parseMcMulti(answer: unknown): string[] {
  if (!answer || typeof answer !== "object") return [];
  const ids = (answer as { optionIds?: string[] }).optionIds;
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((id) => id?.trim()).filter(Boolean))] as string[];
}

function parseTextSingle(answer: unknown): string | null {
  if (!answer || typeof answer !== "object") return null;
  const text = (answer as { text?: string }).text;
  const t = text?.trim() ?? "";
  return t.length > 0 ? t : null;
}

function parseTextMulti(answer: unknown): string | null {
  if (!answer || typeof answer !== "object") return null;
  const values = (answer as { values?: Record<string, string> }).values;
  if (values && typeof values === "object") {
    const filled = Object.values(values)
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    if (filled.length === 0) return null;
    return filled.join(" | ");
  }
  const lines = (answer as { lines?: string[] }).lines;
  if (!Array.isArray(lines)) return null;
  const filled = lines.map((l) => l?.trim() ?? "").filter(Boolean);
  if (filled.length === 0) return null;
  return filled.join(" | ");
}

function parseLikertScale(answer: unknown, scaleSize: number): number | null {
  if (!answer || typeof answer !== "object") return null;
  const value = (answer as { value?: number }).value;
  if (value == null || !isLikertScaleValue(value, scaleSize)) return null;
  return value;
}

function parseRank(answer: unknown): string[] {
  if (!answer || typeof answer !== "object") return [];
  const ids = (answer as { rankedOptionIds?: string[] }).rankedOptionIds;
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => id?.trim()).filter(Boolean) as string[];
}

function parseLikertMulti(answer: unknown, scaleSize: number): Record<string, number> {
  if (!answer || typeof answer !== "object") return {};
  const values = (answer as { values?: Record<string, number> }).values;
  if (!values || typeof values !== "object") return {};
  const out: Record<string, number> = {};
  for (const [optionId, value] of Object.entries(values)) {
    if (isLikertScaleValue(value, scaleSize)) out[optionId] = value;
  }
  return out;
}

function parseStarRating(answer: unknown): number | null {
  if (!answer || typeof answer !== "object") return null;
  const value = (answer as { value?: number }).value;
  if (value == null || !isStarRatingValue(value)) return null;
  return value;
}

function optionMeta(
  options: { id: string; index: number; label: string }[],
  optionId: string,
): { index: number; label: string } | null {
  const found = options.find((o) => o.id === optionId);
  if (found) return { index: found.index, label: found.label };
  return { index: 0, label: `(삭제된 보기: ${optionId.slice(0, 8)}…)` };
}

function parseOtherText(answer: unknown): string | null {
  if (!answer || typeof answer !== "object") return null;
  const text = (answer as { otherText?: string }).otherText;
  const t = text?.trim() ?? "";
  return t.length > 0 ? t : null;
}

function formatAnswer(
  type: QuestionType,
  answer: unknown,
  options: QuestionExportMeta["options"],
  scaleSize: number,
): { code: string; label: string } {
  if (type === "mc_single" || type === "dropdown") {
    const optionId = parseMcSingle(answer);
    if (!optionId) return { code: "", label: "" };
    const meta = optionMeta(options, optionId);
    if (!meta) return { code: "", label: "" };
    const otherText = type === "mc_single" ? parseOtherText(answer) : null;
    const label = otherText ? `${meta.label} (${otherText})` : meta.label;
    return {
      code: meta.index > 0 ? String(meta.index) : "",
      label,
    };
  }

  if (type === "mc_multi") {
    const ids = parseMcMulti(answer);
    if (ids.length === 0) return { code: "", label: "" };
    const otherText = parseOtherText(answer);
    const codes: string[] = [];
    const labels: string[] = [];
    for (const id of ids) {
      const meta = optionMeta(options, id);
      if (!meta) continue;
      if (meta.index > 0) codes.push(String(meta.index));
      const opt = options.find((o) => o.id === id);
      labels.push(
        otherText && opt?.isOther ? `${meta.label} (${otherText})` : meta.label,
      );
    }
    return { code: codes.join(","), label: labels.join(", ") };
  }

  if (type === "text_single") {
    const text = parseTextSingle(answer);
    if (!text) return { code: "", label: "" };
    return { code: text, label: text };
  }

  if (type === "text_multi") {
    const text = parseTextMulti(answer);
    if (!text) return { code: "", label: "" };
    return { code: text, label: text };
  }

  if (type === "likert_7") {
    const value = parseLikertScale(answer, scaleSize);
    if (value == null) return { code: "", label: "" };
    return { code: String(value), label: `${value}점` };
  }

  if (type === "rank") {
    const ids = parseRank(answer);
    if (ids.length === 0) return { code: "", label: "" };
    const codes: string[] = [];
    const labels: string[] = [];
    for (const id of ids) {
      const meta = optionMeta(options, id);
      if (!meta) continue;
      if (meta.index > 0) codes.push(String(meta.index));
      labels.push(meta.label);
    }
    return { code: codes.join(","), label: labels.join(" > ") };
  }

  if (type === "likert_multi") {
    const values = parseLikertMulti(answer, scaleSize);
    const entries = Object.entries(values);
    if (entries.length === 0) return { code: "", label: "" };
    const codes: string[] = [];
    const labels: string[] = [];
    for (const [optionId, value] of entries) {
      const meta = optionMeta(options, optionId);
      const optIndex = meta?.index ?? 0;
      const optLabel = meta?.label ?? optionId.slice(0, 8);
      if (optIndex > 0) codes.push(`${optIndex}:${value}`);
      else codes.push(`${optLabel}:${value}`);
      labels.push(`${optLabel}=${value}점`);
    }
    return { code: codes.join("; "), label: labels.join("; ") };
  }

  if (type === "star_rating") {
    const value = parseStarRating(answer);
    if (value == null) return { code: "", label: "" };
    return { code: String(value), label: `${value}점` };
  }

  if (type === "info_media") {
    return { code: "", label: "" };
  }

  if (type === "contact_fields") {
    if (!answer || typeof answer !== "object") return { code: "", label: "" };
    const values = (answer as { values?: Record<string, string> }).values;
    if (!values || typeof values !== "object") return { code: "", label: "" };
    const parts: string[] = [];
    for (const opt of options) {
      const text = values[opt.id]?.trim() ?? "";
      if (text) parts.push(`${opt.label}: ${text}`);
    }
    if (parts.length === 0) {
      for (const [id, text] of Object.entries(values)) {
        const t = text?.trim() ?? "";
        if (!t) continue;
        const meta = optionMeta(options, id);
        parts.push(`${meta?.label ?? id.slice(0, 8)}: ${t}`);
      }
    }
    if (parts.length === 0) return { code: "", label: "" };
    return { code: parts.join(" | "), label: parts.join(" | ") };
  }

  return { code: "", label: "" };
}

function buildScaleOptions(type: QuestionType, scaleSize: number): QuestionExportMeta["options"] {
  if (type === "likert_7") {
    return likertScaleValues(scaleSize).map((v, i) => ({
      id: `scale-${v}`,
      index: i + 1,
      label: `${v}점`,
    }));
  }
  if (type === "star_rating") {
    const values = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    return values.map((v, i) => ({
      id: `star-${v}`,
      index: i + 1,
      label: `${v}점`,
    }));
  }
  return [];
}

async function loadExportDataset(ref: string): Promise<ExportDataset | null> {
  const survey = await fetchSurveyByRef(ref);
  if (!survey) return null;

  const admin = createSupabaseServiceRoleClient();

  const { data: qRows, error: qError } = await admin
    .from("survey_questions")
    .select("id, order_index, prompt, question_type, max_selections")
    .eq("survey_id", survey.id)
    .order("order_index", { ascending: true });

  if (qError) {
    console.error("[survey-response-export] questions:", qError.message);
    return null;
  }

  const questionRows = (qRows ?? []) as QuestionRow[];
  const questionIds = questionRows.map((q) => q.id);

  const optionsByQuestion = new Map<string, QuestionExportMeta["options"]>();
  if (questionIds.length > 0) {
    let optRows: OptionRow[] = [];
    const withOther = await admin
      .from("survey_question_options")
      .select("id, question_id, order_index, label, is_other")
      .in("question_id", questionIds)
      .order("order_index", { ascending: true });

    if (withOther.error?.message.includes("is_other")) {
      const fallback = await admin
        .from("survey_question_options")
        .select("id, question_id, order_index, label")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true });
      optRows = (fallback.data ?? []) as OptionRow[];
    } else {
      optRows = (withOther.data ?? []) as OptionRow[];
    }

    for (const o of optRows) {
      const list = optionsByQuestion.get(o.question_id) ?? [];
      list.push({
        id: o.id,
        index: list.length + 1,
        label: o.label,
        isOther: Boolean(o.is_other),
      });
      optionsByQuestion.set(o.question_id, list);
    }
  }

  const questions: QuestionExportMeta[] = questionRows.map((q, i) => {
    const type = q.question_type as QuestionType;
    const scaleSize = clampLikertScaleSize(q.max_selections);
    const dbOptions = optionsByQuestion.get(q.id) ?? [];
    const options =
      dbOptions.length > 0 ? dbOptions : buildScaleOptions(type, scaleSize);
    return {
      questionId: q.id,
      questionNumber: i + 1,
      orderIndex: q.order_index,
      prompt: q.prompt,
      type,
      typeLabel: QUESTION_TYPE_LABELS[type] ?? type,
      scaleSize,
      options,
    };
  });

  let responsesRaw: ResponseRow[] = [];
  try {
    responsesRaw = await fetchAllPages<ResponseRow>(async (from, to) =>
      admin
        .from("survey_responses")
        .select("id, submitted_at")
        .eq("survey_id", survey.id)
        .order("submitted_at", { ascending: true })
        .range(from, to),
    );
  } catch (err) {
    console.error("[survey-response-export] responses:", err);
    return null;
  }

  const responseIds = responsesRaw.map((r) => r.id);

  const answersByResponse = new Map<string, Map<string, unknown>>();
  if (responseIds.length > 0) {
    try {
      const answerRows = await fetchAllSurveyResponseAnswers(admin, responseIds);
      for (const row of answerRows) {
        const byQuestion =
          answersByResponse.get(row.response_id) ?? new Map<string, unknown>();
        byQuestion.set(row.question_id, row.answer);
        answersByResponse.set(row.response_id, byQuestion);
      }
    } catch (err) {
      console.error("[survey-response-export] answers:", err);
    }
  }

  const questionById = new Map(questions.map((q) => [q.questionId, q]));

  const responses: ResponseExportRow[] = responsesRaw.map((r, i) => {
    const rawAnswers = answersByResponse.get(r.id) ?? new Map<string, unknown>();
    const answers = new Map<string, { code: string; label: string }>();

    for (const [questionId, answer] of rawAnswers) {
      const q = questionById.get(questionId);
      if (!q) continue;
      answers.set(questionId, formatAnswer(q.type, answer, q.options, q.scaleSize));
    }

    return {
      responseNumber: i + 1,
      submittedAt: r.submitted_at,
      answers,
    };
  });

  return {
    slug: survey.slug,
    title: survey.title,
    questions,
    responses,
  };
}

function buildGuideSheet(): (string | number)[][] {
  return [
    ["설문 응답 데이터 안내"],
    [],
    ["시트 구성"],
    ["문항정의", "문항 제목·유형·선택지(보기) 목록. 응답 시트의 Q번호와 매칭합니다."],
    ["응답_코드", "제출별 문항 응답을 숫자·코드로 표현 (AI 분석용)."],
    ["응답_라벨", "제출별 문항 응답을 보기 텍스트·원문으로 표현."],
    [],
    ["코드 규칙"],
    ["객관식·드롭다운", "보기 번호 (1, 2, 3 …)"],
    ["다중 선택", "선택한 보기 번호를 쉼표로 연결 (예: 1,3)"],
    ["순위", "1순위부터 보기 번호를 쉼표로 연결"],
    ["리커트·별점", "선택한 점수 숫자 (별점은 0~5, 0.5 단위)"],
    ["주관식", "응답 원문"],
    ["무응답", "빈 칸"],
  ];
}

function buildCodebookSheet(questions: QuestionExportMeta[]): (string | number)[][] {
  const header = ["문항번호", "문항ID", "문항유형", "문항제목", "보기번호", "보기ID", "보기내용"];
  const rows: (string | number)[][] = [header];

  for (const q of questions) {
    if (q.type === "text_single" || q.type === "text_multi") {
      rows.push([
        `Q${q.questionNumber}`,
        q.questionId,
        q.typeLabel,
        q.prompt,
        "",
        "",
        "(자유 응답)",
      ]);
      continue;
    }

    if (q.options.length === 0) {
      rows.push([`Q${q.questionNumber}`, q.questionId, q.typeLabel, q.prompt, "", "", ""]);
      continue;
    }

    for (const opt of q.options) {
      rows.push([
        `Q${q.questionNumber}`,
        q.questionId,
        q.typeLabel,
        q.prompt,
        opt.index,
        opt.id.startsWith("scale-") || opt.id.startsWith("star-") ? "" : opt.id,
        opt.label,
      ]);
    }
  }

  return rows;
}

function buildResponseSheet(
  questions: QuestionExportMeta[],
  responses: ResponseExportRow[],
  mode: "code" | "label",
): (string | number)[][] {
  const qHeaders = questions.map((q) => `Q${q.questionNumber}`);
  const promptRow: (string | number)[] = ["", "", ...questions.map((q) => q.prompt)];
  const header: (string | number)[] = ["응답번호", "제출일시", ...qHeaders];
  const rows: (string | number)[][] = [header, promptRow];

  for (const r of responses) {
    const cells = questions.map((q) => {
      const answer = r.answers.get(q.questionId);
      if (!answer) return "";
      return mode === "code" ? answer.code : answer.label;
    });
    rows.push([r.responseNumber, r.submittedAt, ...cells]);
  }

  return rows;
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^\w\u3131-\uD79D-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
}

export function buildSurveyResponseWorkbook(dataset: ExportDataset): Buffer {
  const wb = XLSX.utils.book_new();

  const guide = XLSX.utils.aoa_to_sheet(buildGuideSheet());
  const codebook = XLSX.utils.aoa_to_sheet(buildCodebookSheet(dataset.questions));
  const codeSheet = XLSX.utils.aoa_to_sheet(
    buildResponseSheet(dataset.questions, dataset.responses, "code"),
  );
  const labelSheet = XLSX.utils.aoa_to_sheet(
    buildResponseSheet(dataset.questions, dataset.responses, "label"),
  );

  XLSX.utils.book_append_sheet(wb, guide, "안내");
  XLSX.utils.book_append_sheet(wb, codebook, "문항정의");
  XLSX.utils.book_append_sheet(wb, codeSheet, "응답_코드");
  XLSX.utils.book_append_sheet(wb, labelSheet, "응답_라벨");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function exportSurveyResponsesXlsx(ref: string): Promise<SurveyResponseExportResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, reason: "not_configured" };
  }

  const dataset = await loadExportDataset(ref);
  if (!dataset) {
    return { ok: false, reason: "not_found" };
  }

  const buffer = buildSurveyResponseWorkbook(dataset);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilenamePart(dataset.slug)}_responses_${date}.xlsx`;

  return {
    ok: true,
    slug: dataset.slug,
    title: dataset.title,
    buffer,
    filename,
  };
}
