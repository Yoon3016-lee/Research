import "server-only";

import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import type { QuestionType } from "@/lib/survey-types";

export const NO_ANSWER_LABEL = "무응답";

export type FrequencyBucket = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type QuestionFrequencyStats = {
  questionId: string;
  orderIndex: number;
  prompt: string;
  type: QuestionType;
  allowSkip: boolean;
  totalSubmissions: number;
  answeredCount: number;
  noAnswerCount: number;
  buckets: FrequencyBucket[];
};

export type SurveyResponseStats =
  | {
      ok: true;
      slug: string;
      title: string;
      totalSubmissions: number;
      questions: QuestionFrequencyStats[];
    }
  | { ok: false; reason: "not_configured" | "not_found" };

type SurveyRow = { id: string; slug: string; title: string };

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  allow_skip: boolean;
};

type OptionRow = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
};

type AnswerRow = {
  question_id: string;
  answer: unknown;
};

function pct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function buildBuckets(
  total: number,
  noAnswerCount: number,
  entries: { key: string; label: string; count: number }[],
): FrequencyBucket[] {
  const buckets: FrequencyBucket[] = [];

  buckets.push({
    key: "__no_answer__",
    label: NO_ANSWER_LABEL,
    count: noAnswerCount,
    percent: pct(noAnswerCount, total),
  });

  const sorted = [...entries].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));
  for (const e of sorted) {
    if (e.count <= 0) continue;
    buckets.push({
      key: e.key,
      label: e.label,
      count: e.count,
      percent: pct(e.count, total),
    });
  }

  return buckets;
}

async function fetchSurveyByRef(ref: string): Promise<SurveyRow | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  const select = "id, slug, title";
  const bySlug = await admin.from("surveys").select(select).eq("slug", normalized).maybeSingle();
  if (bySlug.data) return bySlug.data as SurveyRow;
  if (bySlug.error) {
    console.error("[getSurveyResponseStats] slug:", bySlug.error.message);
    return null;
  }

  if (isUuid(normalized)) {
    const byId = await admin.from("surveys").select(select).eq("id", normalized).maybeSingle();
    if (byId.data) return byId.data as SurveyRow;
    if (byId.error) {
      console.error("[getSurveyResponseStats] id:", byId.error.message);
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
  const lines = (answer as { lines?: string[] }).lines;
  if (!Array.isArray(lines)) return null;
  const filled = lines.map((l) => l?.trim() ?? "").filter(Boolean);
  if (filled.length === 0) return null;
  return filled.join(" · ");
}

export async function getSurveyResponseStats(ref: string): Promise<SurveyResponseStats> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, reason: "not_configured" };
  }

  const survey = await fetchSurveyByRef(ref);
  if (!survey) {
    return { ok: false, reason: "not_found" };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: qRows, error: qError } = await admin
    .from("survey_questions")
    .select("id, order_index, prompt, question_type, allow_skip")
    .eq("survey_id", survey.id)
    .order("order_index", { ascending: true });

  if (qError) {
    console.error("[getSurveyResponseStats] questions:", qError.message);
    return { ok: false, reason: "not_found" };
  }

  const questions = (qRows ?? []) as QuestionRow[];
  const questionIds = questions.map((q) => q.id);

  const optionsByQuestion = new Map<string, Map<string, string>>();
  if (questionIds.length > 0) {
    const { data: optRows } = await admin
      .from("survey_question_options")
      .select("id, question_id, order_index, label")
      .in("question_id", questionIds)
      .order("order_index", { ascending: true });

    for (const o of (optRows ?? []) as OptionRow[]) {
      const map = optionsByQuestion.get(o.question_id) ?? new Map<string, string>();
      map.set(o.id, o.label);
      optionsByQuestion.set(o.question_id, map);
    }
  }

  const { data: responseRows, error: rError } = await admin
    .from("survey_responses")
    .select("id")
    .eq("survey_id", survey.id);

  if (rError) {
    console.error("[getSurveyResponseStats] responses:", rError.message);
    return { ok: false, reason: "not_found" };
  }

  const responseIds = (responseRows ?? []).map((r) => r.id as string);
  const totalSubmissions = responseIds.length;

  const answersByQuestion = new Map<string, AnswerRow[]>();
  if (responseIds.length > 0) {
    const { data: answerRows, error: aError } = await admin
      .from("survey_response_answers")
      .select("question_id, answer")
      .in("response_id", responseIds);

    if (aError) {
      console.error("[getSurveyResponseStats] answers:", aError.message);
    } else {
      for (const row of (answerRows ?? []) as AnswerRow[]) {
        const list = answersByQuestion.get(row.question_id) ?? [];
        list.push(row);
        answersByQuestion.set(row.question_id, list);
      }
    }
  }

  const questionStats: QuestionFrequencyStats[] = questions.map((q) => {
    const type = q.question_type as QuestionType;
    const answers = answersByQuestion.get(q.id) ?? [];
    const answeredCount = answers.length;
    const noAnswerCount = Math.max(0, totalSubmissions - answeredCount);
    const optionLabels = optionsByQuestion.get(q.id) ?? new Map<string, string>();

    if (type === "mc_single") {
      const counts = new Map<string, number>();
      for (const [, label] of optionLabels) {
        counts.set(label, 0);
      }
      for (const a of answers) {
        const optionId = parseMcSingle(a.answer);
        if (!optionId) continue;
        const label = optionLabels.get(optionId) ?? `(삭제된 보기: ${optionId.slice(0, 8)}…)`;
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      const entries = [...counts.entries()].map(([label, count]) => ({
        key: label,
        label,
        count,
      }));
      return {
        questionId: q.id,
        orderIndex: q.order_index,
        prompt: q.prompt,
        type,
        allowSkip: q.allow_skip,
        totalSubmissions,
        answeredCount,
        noAnswerCount,
        buckets: buildBuckets(totalSubmissions, noAnswerCount, entries),
      };
    }

    if (type === "mc_multi") {
      const counts = new Map<string, number>();
      for (const [, label] of optionLabels) {
        counts.set(label, 0);
      }
      for (const a of answers) {
        for (const optionId of parseMcMulti(a.answer)) {
          const label = optionLabels.get(optionId) ?? `(삭제된 보기: ${optionId.slice(0, 8)}…)`;
          counts.set(label, (counts.get(label) ?? 0) + 1);
        }
      }
      const entries = [...counts.entries()].map(([label, count]) => ({
        key: label,
        label,
        count,
      }));
      return {
        questionId: q.id,
        orderIndex: q.order_index,
        prompt: q.prompt,
        type,
        allowSkip: q.allow_skip,
        totalSubmissions,
        answeredCount,
        noAnswerCount,
        buckets: buildBuckets(totalSubmissions, noAnswerCount, entries),
      };
    }

    if (type === "text_single") {
      const counts = new Map<string, number>();
      for (const a of answers) {
        const text = parseTextSingle(a.answer);
        if (!text) continue;
        counts.set(text, (counts.get(text) ?? 0) + 1);
      }
      const entries = [...counts.entries()].map(([label, count]) => ({
        key: label,
        label,
        count,
      }));
      return {
        questionId: q.id,
        orderIndex: q.order_index,
        prompt: q.prompt,
        type,
        allowSkip: q.allow_skip,
        totalSubmissions,
        answeredCount,
        noAnswerCount,
        buckets: buildBuckets(totalSubmissions, noAnswerCount, entries),
      };
    }

    // text_multi
    const counts = new Map<string, number>();
    for (const a of answers) {
      const combined = parseTextMulti(a.answer);
      if (!combined) continue;
      counts.set(combined, (counts.get(combined) ?? 0) + 1);
    }
    const entries = [...counts.entries()].map(([label, count]) => ({
      key: label,
      label,
      count,
    }));
    return {
      questionId: q.id,
      orderIndex: q.order_index,
      prompt: q.prompt,
      type,
      allowSkip: q.allow_skip,
      totalSubmissions,
      answeredCount,
      noAnswerCount,
      buckets: buildBuckets(totalSubmissions, noAnswerCount, entries),
    };
  });

  return {
    ok: true,
    slug: survey.slug,
    title: survey.title,
    totalSubmissions,
    questions: questionStats,
  };
}
