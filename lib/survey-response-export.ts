import "server-only";

import * as XLSX from "xlsx";
import { formatDurationSeconds } from "@/lib/survey-duration";
import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { fetchAllPages, fetchAllSurveyResponseAnswers } from "@/lib/supabase-paginate";
import {
  clampLikertScaleSize,
  DEFAULT_LIKERT_SCALE_SIZE,
  displayLikertPointLabel,
  isLikertScaleValue,
  likertCircledMark,
  likertScaleValues,
  normalizeLikertScaleLabels,
  parseLikertScaleLabelsFromDb,
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
  likert_scale_labels?: unknown;
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
  started_at?: string | null;
  duration_seconds?: number | null;
  sample_id?: string | null;
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
  /** likert 척도 크기 */
  scaleSize: number;
  /** mc_multi·rank 등 원본 max_selections */
  maxSelections: number | null;
  /** likert 점수별 라벨 */
  scaleLabels: string[];
  options: { id: string; index: number; label: string; isOther?: boolean }[];
};

export type ResponseExportRow = {
  responseNumber: number;
  submittedAt: string;
  startedAt: string | null;
  durationSeconds: number | null;
  /** 이메일 표본 UID (없으면 null) */
  uid: string | null;
  answers: Map<string, { code: string; label: string }>;
  /** 보기 체크 시트용 원본 답 */
  rawAnswers: Map<string, unknown>;
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
    const otherText = parseOtherText(answer);
    const codes: string[] = [];
    const labels: string[] = [];
    for (const id of ids) {
      const meta = optionMeta(options, id);
      if (!meta) continue;
      if (meta.index > 0) codes.push(String(meta.index));
      const opt = options.find((o) => o.id === id);
      const label =
        otherText && opt?.isOther ? `${meta.label} (${otherText})` : meta.label;
      labels.push(label);
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

function buildScaleOptions(
  type: QuestionType,
  scaleSize: number,
  scaleLabels?: string[] | null,
): QuestionExportMeta["options"] {
  if (type === "likert_7") {
    const labels = normalizeLikertScaleLabels(scaleLabels, scaleSize);
    return likertScaleValues(scaleSize).map((v, i) => ({
      id: `scale-${v}`,
      index: i + 1,
      label: labels[i]?.trim() || `${v}점`,
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
    .select("id, order_index, prompt, question_type, max_selections, likert_scale_labels")
    .eq("survey_id", survey.id)
    .order("order_index", { ascending: true });

  let questionRows: QuestionRow[] = [];
  if (qError?.message.includes("likert_scale_labels")) {
    const fallback = await admin
      .from("survey_questions")
      .select("id, order_index, prompt, question_type, max_selections")
      .eq("survey_id", survey.id)
      .order("order_index", { ascending: true });
    if (fallback.error) {
      console.error("[survey-response-export] questions:", fallback.error.message);
      return null;
    }
    questionRows = (fallback.data ?? []) as QuestionRow[];
  } else if (qError) {
    console.error("[survey-response-export] questions:", qError.message);
    return null;
  } else {
    questionRows = (qRows ?? []) as QuestionRow[];
  }

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
    const isLikert = type === "likert_7" || type === "likert_multi";
    const scaleSize = isLikert
      ? clampLikertScaleSize(q.max_selections)
      : DEFAULT_LIKERT_SCALE_SIZE;
    const maxSelections =
      typeof q.max_selections === "number" && Number.isFinite(q.max_selections)
        ? Math.round(q.max_selections)
        : null;
    const dbOptions = optionsByQuestion.get(q.id) ?? [];
    const scaleLabels = normalizeLikertScaleLabels(
      parseLikertScaleLabelsFromDb(q.likert_scale_labels),
      scaleSize,
    );
    const options =
      dbOptions.length > 0
        ? dbOptions
        : buildScaleOptions(type, scaleSize, scaleLabels);
    return {
      questionId: q.id,
      questionNumber: i + 1,
      orderIndex: q.order_index,
      prompt: q.prompt,
      type,
      typeLabel: QUESTION_TYPE_LABELS[type] ?? type,
      scaleSize,
      maxSelections,
      scaleLabels,
      options,
    };
  });

  let responsesRaw: ResponseRow[] = [];
  try {
    responsesRaw = await fetchAllPages<ResponseRow>(async (from, to) =>
      admin
        .from("survey_responses")
        .select("id, submitted_at, started_at, duration_seconds, sample_id")
        .eq("survey_id", survey.id)
        .order("submitted_at", { ascending: true })
        .range(from, to),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      !message.includes("started_at") &&
      !message.includes("duration_seconds") &&
      !message.includes("sample_id")
    ) {
      console.error("[survey-response-export] responses:", err);
      return null;
    }
    try {
      responsesRaw = await fetchAllPages<ResponseRow>(async (from, to) =>
        admin
          .from("survey_responses")
          .select("id, submitted_at")
          .eq("survey_id", survey.id)
          .order("submitted_at", { ascending: true })
          .range(from, to),
      );
    } catch (retryErr) {
      console.error("[survey-response-export] responses:", retryErr);
      return null;
    }
  }

  const responseIds = responsesRaw.map((r) => r.id);

  const uidBySampleId = new Map<string, string>();
  const sampleIds = [
    ...new Set(
      responsesRaw
        .map((r) => r.sample_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  if (sampleIds.length > 0) {
    const { data: samples } = await admin
      .from("survey_samples")
      .select("id, uid")
      .in("id", sampleIds);
    for (const s of samples ?? []) {
      const uid = String((s as { uid?: string }).uid ?? "").trim();
      if (uid) uidBySampleId.set((s as { id: string }).id, uid);
    }
  }

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

    const sampleId = r.sample_id ?? null;
    return {
      responseNumber: i + 1,
      submittedAt: r.submitted_at,
      startedAt: r.started_at ?? null,
      durationSeconds:
        typeof r.duration_seconds === "number" ? r.duration_seconds : null,
      uid: sampleId ? uidBySampleId.get(sampleId) ?? null : null,
      answers,
      rawAnswers,
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
    ["응답_코드", "제출별 문항 응답을 숫자·코드로 표현 (AI 분석·집계용)."],
    [
      "응답_정리",
      "조사표형 응답표(헤더 3행). 1행 유형·2행 문항제목·3행 보기/항목. 선택 칸에 보기 번호(순위는 N순위). 다중척도는 「문항제목 - 항목」으로 열 구분.",
    ],
    [
      "응답_요약",
      "압축 응답표(헤더 3행). 문항(또는 하위 항목)당 1열. 3행에 보기 목록, 응답 칸에는 ①·② 등 선택 기호(다중은 쉼표, 순위는 1순위=② 형식).",
    ],
    [],
    ["응답_정리 규칙"],
    ["객관식·드롭다운·리커트", "고른 보기(점수) 칸에 해당 번호 기입"],
    ["다중 선택", "고른 보기마다 해당 번호 기입"],
    ["순위", "보기 칸에 1순위·2순위… 기입"],
    ["별점", "0~5 점수 숫자"],
    ["주관식·연락처", "항목별 응답 칸에 원문"],
    ["무응답", "빈 칸"],
    [],
    ["응답_코드 규칙"],
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

    if (q.type === "likert_multi") {
      for (const opt of q.options) {
        for (const v of likertScaleValues(q.scaleSize)) {
          rows.push([
            `Q${q.questionNumber}`,
            q.questionId,
            q.typeLabel,
            `${q.prompt} / ${opt.label}`,
            v,
            "",
            displayLikertPointLabel(v - 1, q.scaleLabels),
          ]);
        }
      }
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

function buildResponseCodeSheet(
  questions: QuestionExportMeta[],
  responses: ResponseExportRow[],
): (string | number)[][] {
  const exportQuestions = questions.filter((q) => q.type !== "info_media");
  const qHeaders = exportQuestions.map((q) => `Q${q.questionNumber}`);
  const promptRow: (string | number)[] = [
    "",
    "",
    "",
    "",
    "",
    ...exportQuestions.map((q) => q.prompt),
  ];
  const header: (string | number)[] = [
    "응답번호",
    "제출일시",
    "시작시각",
    "소요시간(초)",
    "소요시간",
    ...qHeaders,
  ];
  const rows: (string | number)[][] = [header, promptRow];

  for (const r of responses) {
    const cells = exportQuestions.map((q) => {
      const answer = r.answers.get(q.questionId);
      if (!answer) return "";
      return answer.code;
    });
    rows.push([
      r.responseNumber,
      r.submittedAt,
      r.startedAt ?? "",
      r.durationSeconds ?? "",
      formatDurationSeconds(r.durationSeconds),
      ...cells,
    ]);
  }

  return rows;
}

function parseFieldValues(answer: unknown): Record<string, string> {
  if (!answer || typeof answer !== "object") return {};
  const values = (answer as { values?: Record<string, string> }).values;
  if (!values || typeof values !== "object") return {};
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(values)) {
    const text = String(value ?? "").trim();
    if (text) out[id] = text;
  }
  return out;
}

function questionTypeBanner(q: QuestionExportMeta): string {
  const n = q.questionNumber;
  if (q.type === "mc_multi" && q.maxSelections != null && q.maxSelections > 0) {
    return `Q${n}(${q.typeLabel})-최대${q.maxSelections}개`;
  }
  if (q.type === "rank" && q.maxSelections != null && q.maxSelections > 0) {
    return `Q${n}(${q.typeLabel})-최대${q.maxSelections}순위`;
  }
  return `Q${n}(${q.typeLabel})`;
}

function questionTitleBanner(q: QuestionExportMeta): string {
  return `SQ${q.questionNumber}. ${q.prompt}`;
}

function circledOptionLabel(index: number, label: string): string {
  return `${likertCircledMark(index)}${label}`;
}

type SummaryCol = {
  role: "meta" | "question";
  metaKey?: "uid" | "title" | "startedAt" | "submittedAt" | "duration" | "completed";
  questionId?: string;
  optionId?: string;
  optionIndex?: number;
  itemId?: string;
  fieldId?: string;
  /** 1행: Qn(유형) 또는 메타 라벨 */
  typeHeader: string;
  /** 2행: SQn. 제목 (다중척도는 「제목 - 항목」) */
  titleHeader: string;
  /** 3행: 보기·척도·필드명·응답 */
  leafHeader: string;
  typeGroup: string;
  titleGroup: string;
};

function buildSummaryColumns(questions: QuestionExportMeta[]): SummaryCol[] {
  const metaLabels: { key: NonNullable<SummaryCol["metaKey"]>; label: string }[] = [
    { key: "uid", label: "UID" },
    { key: "title", label: "설문지 제목" },
    { key: "startedAt", label: "응답 시작일시" },
    { key: "submittedAt", label: "응답 완료일시" },
    { key: "duration", label: "응답 소요시간" },
    { key: "completed", label: "응답 완료여부" },
  ];

  const cols: SummaryCol[] = metaLabels.map(({ key, label }) => ({
    role: "meta",
    metaKey: key,
    typeHeader: label,
    titleHeader: label,
    leafHeader: label,
    typeGroup: `meta:${key}`,
    titleGroup: `meta:${key}`,
  }));

  for (const q of questions) {
    if (q.type === "info_media") continue;

    const typeHeader = questionTypeBanner(q);
    const titleHeader = questionTitleBanner(q);
    const typeGroup = `q:${q.questionId}:type`;
    const titleGroup = `q:${q.questionId}:title`;

    if (
      q.type === "mc_single" ||
      q.type === "mc_multi" ||
      q.type === "dropdown" ||
      q.type === "rank"
    ) {
      for (const opt of q.options) {
        cols.push({
          role: "question",
          questionId: q.questionId,
          optionId: opt.id,
          optionIndex: opt.index,
          typeHeader,
          titleHeader,
          leafHeader: circledOptionLabel(opt.index, opt.label),
          typeGroup,
          titleGroup,
        });
      }
      continue;
    }

    if (q.type === "likert_7") {
      for (const v of likertScaleValues(q.scaleSize)) {
        const i = v - 1;
        const custom = q.scaleLabels[i]?.trim();
        cols.push({
          role: "question",
          questionId: q.questionId,
          optionId: `scale-${v}`,
          optionIndex: v,
          typeHeader,
          titleHeader,
          leafHeader: custom
            ? `${likertCircledMark(v)}${custom}`
            : likertCircledMark(v),
          typeGroup,
          titleGroup,
        });
      }
      continue;
    }

    if (q.type === "likert_multi") {
      const items =
        q.options.length > 0 ? q.options : [{ id: "_", index: 1, label: "항목" }];
      for (const item of items) {
        const itemTitle = `${questionTitleBanner(q)} - SQ${q.questionNumber}-${item.index} ${item.label}`;
        const itemTitleGroup = `q:${q.questionId}:item:${item.id}`;
        for (const v of likertScaleValues(q.scaleSize)) {
          const i = v - 1;
          const custom = q.scaleLabels[i]?.trim();
          cols.push({
            role: "question",
            questionId: q.questionId,
            itemId: item.id,
            optionId: `scale-${v}`,
            optionIndex: v,
            typeHeader,
            titleHeader: itemTitle,
            leafHeader: custom
              ? `${likertCircledMark(v)}${custom}`
              : likertCircledMark(v),
            typeGroup,
            titleGroup: itemTitleGroup,
          });
        }
      }
      continue;
    }

    if (q.type === "star_rating") {
      cols.push({
        role: "question",
        questionId: q.questionId,
        typeHeader,
        titleHeader,
        leafHeader: "0~5점",
        typeGroup,
        titleGroup,
      });
      continue;
    }

    if (q.type === "text_single") {
      cols.push({
        role: "question",
        questionId: q.questionId,
        typeHeader,
        titleHeader,
        leafHeader: "응답",
        typeGroup,
        titleGroup,
      });
      continue;
    }

    if (q.type === "text_multi" || q.type === "contact_fields") {
      const fields =
        q.options.length > 0 ? q.options : [{ id: "_", index: 1, label: "항목" }];
      for (const field of fields) {
        cols.push({
          role: "question",
          questionId: q.questionId,
          fieldId: field.id,
          typeHeader,
          titleHeader,
          leafHeader: `SQ${q.questionNumber}-${field.index} ${field.label}`,
          typeGroup,
          titleGroup,
        });
      }
      continue;
    }

    cols.push({
      role: "question",
      questionId: q.questionId,
      typeHeader,
      titleHeader,
      leafHeader: "응답",
      typeGroup,
      titleGroup,
    });
  }

  return cols;
}

function summaryCellValue(
  col: SummaryCol,
  dataset: ExportDataset,
  response: ResponseExportRow,
  questionById: Map<string, QuestionExportMeta>,
): string | number {
  if (col.role === "meta") {
    switch (col.metaKey) {
      case "uid":
        return response.uid
          ? `UID(${response.uid})`
          : `응답${response.responseNumber}`;
      case "title":
        return dataset.title;
      case "startedAt":
        return response.startedAt ?? "";
      case "submittedAt":
        return response.submittedAt;
      case "duration":
        return (
          formatDurationSeconds(response.durationSeconds) ||
          response.durationSeconds ||
          ""
        );
      case "completed":
        return "완료";
      default:
        return "";
    }
  }

  const q = col.questionId ? questionById.get(col.questionId) : null;
  if (!q) return "";
  const raw = response.rawAnswers.get(q.questionId);

  if (q.type === "mc_single" || q.type === "dropdown") {
    if (raw == null || !col.optionId) return "";
    const selected = parseMcSingle(raw);
    if (!selected || selected !== col.optionId) return "";
    const idx = col.optionIndex ?? "";
    if (q.type === "mc_single") {
      const other = parseOtherText(raw);
      const opt = q.options.find((o) => o.id === col.optionId);
      if (other && opt?.isOther) return `${idx} (${other})`;
    }
    return idx;
  }

  if (q.type === "mc_multi") {
    if (raw == null || !col.optionId) return "";
    const ids = parseMcMulti(raw);
    if (!ids.includes(col.optionId)) return "";
    const idx = col.optionIndex ?? "";
    const other = parseOtherText(raw);
    const opt = q.options.find((o) => o.id === col.optionId);
    if (other && opt?.isOther) return `${idx} (${other})`;
    return idx;
  }

  if (q.type === "rank") {
    if (raw == null || !col.optionId) return "";
    const ids = parseRank(raw);
    const rank = ids.indexOf(col.optionId);
    if (rank < 0) return "";
    const other = parseOtherText(raw);
    const opt = q.options.find((o) => o.id === col.optionId);
    if (other && opt?.isOther) return `${rank + 1}순위 (${other})`;
    return `${rank + 1}순위`;
  }

  if (q.type === "likert_7") {
    if (raw == null || !col.optionId) return "";
    const value = parseLikertScale(raw, q.scaleSize);
    if (value == null) return "";
    return col.optionId === `scale-${value}` ? value : "";
  }

  if (q.type === "likert_multi") {
    if (raw == null || !col.itemId || !col.optionId) return "";
    const values = parseLikertMulti(raw, q.scaleSize);
    const value = values[col.itemId];
    if (value == null) return "";
    return col.optionId === `scale-${value}` ? value : "";
  }

  if (q.type === "star_rating") {
    if (raw == null) return "";
    const value = parseStarRating(raw);
    return value == null ? "" : value;
  }

  if (q.type === "text_single") {
    if (raw == null) return "";
    return parseTextSingle(raw) ?? "";
  }

  if (q.type === "text_multi" || q.type === "contact_fields") {
    if (raw == null || !col.fieldId) return "";
    const values = parseFieldValues(raw);
    return values[col.fieldId] ?? "";
  }

  return response.answers.get(q.questionId)?.label ?? "";
}

function pushMergeRanges<T extends { role: "meta" | "question" }>(
  merges: XLSX.Range[],
  row: number,
  cols: T[],
  groupOf: (col: T) => string,
  skipMeta: boolean,
) {
  let start = 0;
  while (start < cols.length) {
    if (skipMeta && cols[start]!.role === "meta") {
      start += 1;
      continue;
    }
    const key = groupOf(cols[start]!);
    let end = start;
    while (end + 1 < cols.length && groupOf(cols[end + 1]!) === key) {
      end += 1;
    }
    if (end > start) {
      merges.push({ s: { r: row, c: start }, e: { r: row, c: end } });
    }
    start = end + 1;
  }
}

function buildSummarySheet(dataset: ExportDataset): XLSX.WorkSheet {
  const questionById = new Map(dataset.questions.map((q) => [q.questionId, q]));
  const columns = buildSummaryColumns(dataset.questions);

  const row0 = columns.map((c) => c.typeHeader);
  const row1 = columns.map((c) => c.titleHeader);
  const row2 = columns.map((c) => c.leafHeader);

  const dataRows = dataset.responses.map((r) =>
    columns.map((col) => summaryCellValue(col, dataset, r, questionById)),
  );

  const sheet = XLSX.utils.aoa_to_sheet([row0, row1, row2, ...dataRows]);
  const merges: XLSX.Range[] = [];

  // 메타열 세로 병합 (헤더 3행: 0~2)
  for (let c = 0; c < columns.length; c++) {
    if (columns[c]!.role === "meta") {
      merges.push({ s: { r: 0, c }, e: { r: 2, c } });
    }
  }

  pushMergeRanges(merges, 0, columns, (c) => c.typeGroup, true);
  pushMergeRanges(merges, 1, columns, (c) => c.titleGroup, true);

  sheet["!merges"] = merges;
  sheet["!cols"] = columns.map((col) => {
    if (col.role === "meta") return { wch: 16 };
    if (col.leafHeader === "응답" || col.leafHeader.startsWith("SQ")) return { wch: 22 };
    return { wch: Math.min(22, Math.max(8, String(col.leafHeader).length + 2)) };
  });

  return sheet;
}

type OverviewCol = {
  role: "meta" | "question";
  metaKey?: "uid" | "title" | "startedAt" | "submittedAt" | "duration" | "completed";
  questionId?: string;
  itemId?: string;
  fieldId?: string;
  typeHeader: string;
  titleHeader: string;
  leafHeader: string;
  typeGroup: string;
  titleGroup: string;
};

function choiceOptionLegend(q: QuestionExportMeta): string {
  if (q.type === "likert_7") {
    return likertScaleValues(q.scaleSize)
      .map((v) => {
        const custom = q.scaleLabels[v - 1]?.trim();
        return custom ? `${likertCircledMark(v)}${custom}` : likertCircledMark(v);
      })
      .join(" ");
  }
  return q.options.map((opt) => circledOptionLabel(opt.index, opt.label)).join(",");
}

function likertScaleLegend(q: QuestionExportMeta): string {
  return likertScaleValues(q.scaleSize)
    .map((v) => {
      const custom = q.scaleLabels[v - 1]?.trim();
      return custom ? `${likertCircledMark(v)}${custom}` : likertCircledMark(v);
    })
    .join(" ");
}

function buildOverviewColumns(questions: QuestionExportMeta[]): OverviewCol[] {
  const metaLabels: { key: NonNullable<OverviewCol["metaKey"]>; label: string }[] = [
    { key: "uid", label: "UID" },
    { key: "title", label: "설문지 제목" },
    { key: "startedAt", label: "응답 시작일시" },
    { key: "submittedAt", label: "응답 완료일시" },
    { key: "duration", label: "응답 소요시간" },
    { key: "completed", label: "응답 완료여부" },
  ];

  const cols: OverviewCol[] = metaLabels.map(({ key, label }) => ({
    role: "meta",
    metaKey: key,
    typeHeader: label,
    titleHeader: label,
    leafHeader: label,
    typeGroup: `meta:${key}`,
    titleGroup: `meta:${key}`,
  }));

  for (const q of questions) {
    if (q.type === "info_media") continue;

    const typeHeader = questionTypeBanner(q);
    const typeGroup = `q:${q.questionId}:type`;

    if (q.type === "likert_multi") {
      const items =
        q.options.length > 0 ? q.options : [{ id: "_", index: 1, label: "항목" }];
      const legend = likertScaleLegend(q);
      for (const item of items) {
        cols.push({
          role: "question",
          questionId: q.questionId,
          itemId: item.id,
          typeHeader,
          titleHeader: `${q.prompt} - SQ${q.questionNumber}-${item.index} ${item.label}`,
          leafHeader: legend,
          typeGroup,
          titleGroup: `q:${q.questionId}:item:${item.id}`,
        });
      }
      continue;
    }

    if (q.type === "text_multi" || q.type === "contact_fields") {
      const fields =
        q.options.length > 0 ? q.options : [{ id: "_", index: 1, label: "항목" }];
      const titleGroup = `q:${q.questionId}:title`;
      for (const field of fields) {
        cols.push({
          role: "question",
          questionId: q.questionId,
          fieldId: field.id,
          typeHeader,
          titleHeader: q.prompt,
          leafHeader: `SQ${q.questionNumber}-${field.index} ${field.label}`,
          typeGroup,
          titleGroup,
        });
      }
      continue;
    }

    let leafHeader = "응답";
    if (
      q.type === "mc_single" ||
      q.type === "mc_multi" ||
      q.type === "dropdown" ||
      q.type === "rank" ||
      q.type === "likert_7"
    ) {
      leafHeader = choiceOptionLegend(q);
    } else if (q.type === "star_rating") {
      leafHeader = "0~5점";
    } else if (q.type === "text_single") {
      leafHeader = "응답";
    }

    cols.push({
      role: "question",
      questionId: q.questionId,
      typeHeader,
      titleHeader: q.prompt,
      leafHeader,
      typeGroup,
      titleGroup: `q:${q.questionId}:title`,
    });
  }

  return cols;
}

function overviewCellValue(
  col: OverviewCol,
  dataset: ExportDataset,
  response: ResponseExportRow,
  questionById: Map<string, QuestionExportMeta>,
): string | number {
  if (col.role === "meta") {
    switch (col.metaKey) {
      case "uid":
        return response.uid
          ? `UID(${response.uid})`
          : `응답${response.responseNumber}`;
      case "title":
        return dataset.title;
      case "startedAt":
        return response.startedAt ?? "";
      case "submittedAt":
        return response.submittedAt;
      case "duration":
        return (
          formatDurationSeconds(response.durationSeconds) ||
          response.durationSeconds ||
          ""
        );
      case "completed":
        return "완료";
      default:
        return "";
    }
  }

  const q = col.questionId ? questionById.get(col.questionId) : null;
  if (!q) return "";
  const raw = response.rawAnswers.get(q.questionId);

  if (q.type === "mc_single" || q.type === "dropdown") {
    if (raw == null) return "";
    const selected = parseMcSingle(raw);
    if (!selected) return "";
    const meta = optionMeta(q.options, selected);
    if (!meta || meta.index <= 0) return "";
    const mark = likertCircledMark(meta.index);
    if (q.type === "mc_single") {
      const other = parseOtherText(raw);
      const opt = q.options.find((o) => o.id === selected);
      if (other && opt?.isOther) return `${mark} (${other})`;
    }
    return mark;
  }

  if (q.type === "mc_multi") {
    if (raw == null) return "";
    const ids = parseMcMulti(raw);
    const marks: string[] = [];
    for (const id of ids) {
      const meta = optionMeta(q.options, id);
      if (!meta || meta.index <= 0) continue;
      const mark = likertCircledMark(meta.index);
      const other = parseOtherText(raw);
      const opt = q.options.find((o) => o.id === id);
      marks.push(other && opt?.isOther ? `${mark} (${other})` : mark);
    }
    return marks.join(",");
  }

  if (q.type === "rank") {
    if (raw == null) return "";
    const ids = parseRank(raw);
    const other = parseOtherText(raw);
    const parts: string[] = [];
    ids.forEach((id, i) => {
      const meta = optionMeta(q.options, id);
      if (!meta || meta.index <= 0) return;
      const opt = q.options.find((o) => o.id === id);
      const suffix = other && opt?.isOther ? ` (${other})` : "";
      parts.push(`${i + 1}순위=${likertCircledMark(meta.index)}${suffix}`);
    });
    return parts.join(", ");
  }

  if (q.type === "likert_7") {
    if (raw == null) return "";
    const value = parseLikertScale(raw, q.scaleSize);
    if (value == null) return "";
    return likertCircledMark(value);
  }

  if (q.type === "likert_multi") {
    if (raw == null || !col.itemId) return "";
    const values = parseLikertMulti(raw, q.scaleSize);
    const value = values[col.itemId];
    if (value == null) return "";
    return likertCircledMark(value);
  }

  if (q.type === "star_rating") {
    if (raw == null) return "";
    const value = parseStarRating(raw);
    return value == null ? "" : value;
  }

  if (q.type === "text_single") {
    if (raw == null) return "";
    return parseTextSingle(raw) ?? "";
  }

  if (q.type === "text_multi" || q.type === "contact_fields") {
    if (raw == null || !col.fieldId) return "";
    const values = parseFieldValues(raw);
    return values[col.fieldId] ?? "";
  }

  return response.answers.get(q.questionId)?.label ?? "";
}

function buildOverviewSheet(dataset: ExportDataset): XLSX.WorkSheet {
  const questionById = new Map(dataset.questions.map((q) => [q.questionId, q]));
  const columns = buildOverviewColumns(dataset.questions);

  const row0 = columns.map((c) => c.typeHeader);
  const row1 = columns.map((c) => c.titleHeader);
  const row2 = columns.map((c) => c.leafHeader);
  const dataRows = dataset.responses.map((r) =>
    columns.map((col) => overviewCellValue(col, dataset, r, questionById)),
  );

  const sheet = XLSX.utils.aoa_to_sheet([row0, row1, row2, ...dataRows]);
  const merges: XLSX.Range[] = [];

  for (let c = 0; c < columns.length; c++) {
    if (columns[c]!.role === "meta") {
      merges.push({ s: { r: 0, c }, e: { r: 2, c } });
    }
  }

  pushMergeRanges(merges, 0, columns, (c) => c.typeGroup, true);
  pushMergeRanges(merges, 1, columns, (c) => c.titleGroup, true);

  sheet["!merges"] = merges;
  sheet["!cols"] = columns.map((col) => {
    if (col.role === "meta") return { wch: 16 };
    if (col.leafHeader.length > 40) return { wch: 28 };
    return { wch: Math.min(24, Math.max(12, col.titleHeader.length + 2)) };
  });

  return sheet;
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^\w\u3131-\uD79D-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
}

export function buildSurveyResponseWorkbook(dataset: ExportDataset): Buffer {
  const wb = XLSX.utils.book_new();

  const guide = XLSX.utils.aoa_to_sheet(buildGuideSheet());
  const codebook = XLSX.utils.aoa_to_sheet(buildCodebookSheet(dataset.questions));
  const codeSheet = XLSX.utils.aoa_to_sheet(
    buildResponseCodeSheet(dataset.questions, dataset.responses),
  );
  const summarySheet = buildSummarySheet(dataset);
  const overviewSheet = buildOverviewSheet(dataset);

  XLSX.utils.book_append_sheet(wb, guide, "안내");
  XLSX.utils.book_append_sheet(wb, codebook, "문항정의");
  XLSX.utils.book_append_sheet(wb, codeSheet, "응답_코드");
  XLSX.utils.book_append_sheet(wb, summarySheet, "응답_정리");
  XLSX.utils.book_append_sheet(wb, overviewSheet, "응답_요약");

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
