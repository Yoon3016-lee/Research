import "server-only";

import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { fetchAllPages, fetchAllSurveyResponseAnswers } from "@/lib/supabase-paginate";
import {
  NO_ANSWER_LABEL,
  type FrequencyBucket,
  type QuestionFrequencyStats,
  type SurveyResponseStats,
} from "@/lib/survey-response-stats-shared";
import { emptyDurationSummary, summarizeDurations } from "@/lib/survey-duration";
import {
  clampLikertScaleSize,
  isLikertScaleValue,
  likertScaleValues,
} from "@/lib/likert-scale";
import { isStarRatingValue, type QuestionType } from "@/lib/survey-types";

export {
  NO_ANSWER_LABEL,
  type FrequencyBucket,
  type QuestionFrequencyStats,
  type SurveyResponseStats,
} from "@/lib/survey-response-stats-shared";

type RespondentKind = "staff" | "guest";

type AnswerWithKind = {
  question_id: string;
  answer: unknown;
  kind: RespondentKind;
};

type BucketCounts = {
  staff: number;
  guest: number;
};

type SurveyRow = { id: string; slug: string; title: string };

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  allow_skip: boolean;
  max_selections: number | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
};

type ResponseRow = {
  id: string;
  respondent_kind: string;
  duration_seconds?: number | null;
};

function pct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function toBucket(
  key: string,
  label: string,
  counts: BucketCounts,
  total: number,
): FrequencyBucket {
  const count = counts.staff + counts.guest;
  return {
    key,
    label,
    count,
    percent: pct(count, total),
    staffCount: counts.staff,
    guestCount: counts.guest,
  };
}

function buildLikertBuckets(
  total: number,
  noAnswer: BucketCounts,
  entries: { key: string; label: string; counts: BucketCounts }[],
): FrequencyBucket[] {
  const buckets: FrequencyBucket[] = [toBucket("__no_answer__", NO_ANSWER_LABEL, noAnswer, total)];
  for (const e of entries) {
    buckets.push(toBucket(e.key, e.label, e.counts, total));
  }
  return buckets;
}

function buildBuckets(
  total: number,
  noAnswer: BucketCounts,
  entries: { key: string; label: string; counts: BucketCounts }[],
): FrequencyBucket[] {
  const buckets: FrequencyBucket[] = [toBucket("__no_answer__", NO_ANSWER_LABEL, noAnswer, total)];

  const sorted = [...entries].sort(
    (a, b) =>
      b.counts.staff + b.counts.guest - (a.counts.staff + a.counts.guest) ||
      a.label.localeCompare(b.label, "ko"),
  );
  for (const e of sorted) {
    if (e.counts.staff + e.counts.guest <= 0) continue;
    buckets.push(toBucket(e.key, e.label, e.counts, total));
  }

  return buckets;
}

function emptyCounts(): BucketCounts {
  return { staff: 0, guest: 0 };
}

function bump(counts: BucketCounts, kind: RespondentKind): void {
  if (kind === "staff") counts.staff += 1;
  else counts.guest += 1;
}

function responseKind(row: ResponseRow): RespondentKind {
  return row.respondent_kind === "staff" ? "staff" : "guest";
}

function noAnswerByKind(
  responses: ResponseRow[],
  answeredResponseIds: Set<string>,
): BucketCounts {
  const counts = emptyCounts();
  for (const r of responses) {
    if (answeredResponseIds.has(r.id)) continue;
    bump(counts, responseKind(r));
  }
  return counts;
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

function parseLikertScale(answer: unknown, scaleSize: number): number | null {
  if (!answer || typeof answer !== "object") return null;
  const value = (answer as { value?: number }).value;
  if (value == null || !isLikertScaleValue(value, scaleSize)) return null;
  return value;
}

function parseTextMulti(answer: unknown): string | null {
  if (!answer || typeof answer !== "object") return null;
  const values = (answer as { values?: Record<string, string> }).values;
  if (values && typeof values === "object") {
    const filled = Object.values(values)
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    if (filled.length === 0) return null;
    return filled.join(" · ");
  }
  const lines = (answer as { lines?: string[] }).lines;
  if (!Array.isArray(lines)) return null;
  const filled = lines.map((l) => l?.trim() ?? "").filter(Boolean);
  if (filled.length === 0) return null;
  return filled.join(" · ");
}

function parseRank(answer: unknown, optionLabels: Map<string, string>): string | null {
  if (!answer || typeof answer !== "object") return null;
  const ids = (answer as { rankedOptionIds?: string[] }).rankedOptionIds;
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const parts = ids.map((id, i) => {
    const label = optionLabels.get(id) ?? id.slice(0, 8);
    return `${i + 1}위: ${label}`;
  });
  return parts.join(" · ");
}

function parseLikertMulti(
  answer: unknown,
  optionLabels: Map<string, string>,
  scaleSize: number,
): string | null {
  if (!answer || typeof answer !== "object") return null;
  const values = (answer as { values?: Record<string, number> }).values;
  if (!values || typeof values !== "object") return null;
  const parts: string[] = [];
  for (const [optionId, value] of Object.entries(values)) {
    if (!isLikertScaleValue(value, scaleSize)) continue;
    const label = optionLabels.get(optionId) ?? optionId.slice(0, 8);
    parts.push(`${label}: ${value}점`);
  }
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function parseStarRating(answer: unknown): number | null {
  if (!answer || typeof answer !== "object") return null;
  const value = (answer as { value?: number }).value;
  if (value == null || !isStarRatingValue(value)) return null;
  return value;
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
    .select("id, order_index, prompt, question_type, allow_skip, max_selections")
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

  let responses: ResponseRow[] = [];
  try {
    responses = await fetchAllPages<ResponseRow>(async (from, to) =>
      admin
        .from("survey_responses")
        .select("id, respondent_kind, duration_seconds")
        .eq("survey_id", survey.id)
        .order("submitted_at", { ascending: true })
        .range(from, to),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("duration_seconds")) {
      try {
        responses = await fetchAllPages<ResponseRow>(async (from, to) =>
          admin
            .from("survey_responses")
            .select("id, respondent_kind")
            .eq("survey_id", survey.id)
            .order("submitted_at", { ascending: true })
            .range(from, to),
        );
      } catch (retryErr) {
        console.error("[getSurveyResponseStats] responses:", retryErr);
        return { ok: false, reason: "not_found" };
      }
    } else {
      console.error("[getSurveyResponseStats] responses:", err);
      return { ok: false, reason: "not_found" };
    }
  }

  const responseIds = responses.map((r) => r.id);
  const totalSubmissions = responseIds.length;

  const kindByResponseId = new Map<string, RespondentKind>();
  for (const r of responses) {
    kindByResponseId.set(r.id, responseKind(r));
  }

  const answersByQuestion = new Map<string, AnswerWithKind[]>();
  const answeredByQuestion = new Map<string, Set<string>>();

  if (responseIds.length > 0) {
    try {
      const answerRows = await fetchAllSurveyResponseAnswers(admin, responseIds);
      const seenAnswerKeys = new Set<string>();
      for (const row of answerRows) {
        const dedupeKey = `${row.response_id}\0${row.question_id}`;
        if (seenAnswerKeys.has(dedupeKey)) continue;
        seenAnswerKeys.add(dedupeKey);

        const responseId = row.response_id;
        const questionId = row.question_id;
        const kind = kindByResponseId.get(responseId) ?? "guest";
        const item: AnswerWithKind = {
          question_id: questionId,
          answer: row.answer,
          kind,
        };
        const list = answersByQuestion.get(questionId) ?? [];
        list.push(item);
        answersByQuestion.set(questionId, list);

        const answered = answeredByQuestion.get(questionId) ?? new Set<string>();
        answered.add(responseId);
        answeredByQuestion.set(questionId, answered);
      }
    } catch (err) {
      console.error("[getSurveyResponseStats] answers:", err);
    }
  }

  const questionStats: QuestionFrequencyStats[] = questions.map((q) => {
    const type = q.question_type as QuestionType;
    const answers = answersByQuestion.get(q.id) ?? [];
    const answeredResponseIds = answeredByQuestion.get(q.id) ?? new Set<string>();
    const answeredCount = answeredResponseIds.size;
    const noAnswerCount = Math.max(0, totalSubmissions - answeredCount);
    const noAnswer = noAnswerByKind(responses, answeredResponseIds);
    const optionLabels = optionsByQuestion.get(q.id) ?? new Map<string, string>();

    const base = {
      questionId: q.id,
      orderIndex: q.order_index,
      prompt: q.prompt,
      type,
      allowSkip: q.allow_skip,
      totalSubmissions,
      answeredCount,
      noAnswerCount,
    };

    if (type === "mc_single") {
      const counts = new Map<string, BucketCounts>();
      for (const [, label] of optionLabels) {
        counts.set(label, emptyCounts());
      }
      for (const a of answers) {
        const optionId = parseMcSingle(a.answer);
        if (!optionId) continue;
        const label = optionLabels.get(optionId) ?? `(삭제된 보기: ${optionId.slice(0, 8)}…)`;
        const c = counts.get(label) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(label, c);
      }
      const entries = [...counts.entries()].map(([label, counts]) => ({
        key: label,
        label,
        counts,
      }));
      return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "mc_multi") {
      const counts = new Map<string, BucketCounts>();
      for (const [, label] of optionLabels) {
        counts.set(label, emptyCounts());
      }
      for (const a of answers) {
        for (const optionId of parseMcMulti(a.answer)) {
          const label = optionLabels.get(optionId) ?? `(삭제된 보기: ${optionId.slice(0, 8)}…)`;
          const c = counts.get(label) ?? emptyCounts();
          bump(c, a.kind);
          counts.set(label, c);
        }
      }
      const entries = [...counts.entries()].map(([label, counts]) => ({
        key: label,
        label,
        counts,
      }));
      return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "text_single") {
      const counts = new Map<string, BucketCounts>();
      for (const a of answers) {
        const text = parseTextSingle(a.answer);
        if (!text) continue;
        const c = counts.get(text) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(text, c);
      }
      const entries = [...counts.entries()].map(([label, counts]) => ({
        key: label,
        label,
        counts,
      }));
      return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "text_multi") {
      const counts = new Map<string, BucketCounts>();
      for (const a of answers) {
        const combined = parseTextMulti(a.answer);
        if (!combined) continue;
        const c = counts.get(combined) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(combined, c);
      }
      const entries = [...counts.entries()].map(([label, counts]) => ({
        key: label,
        label,
        counts,
      }));
      return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "likert_7") {
      const scaleSize = clampLikertScaleSize(q.max_selections);
      const scaleValues = likertScaleValues(scaleSize);
      const counts = new Map<number, BucketCounts>();
      for (const v of scaleValues) {
        counts.set(v, emptyCounts());
      }
      for (const a of answers) {
        const value = parseLikertScale(a.answer, scaleSize);
        if (value == null) continue;
        const c = counts.get(value) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(value, c);
      }
      const entries = scaleValues.map((v) => ({
        key: String(v),
        label: `${v}점`,
        counts: counts.get(v) ?? emptyCounts(),
      }));
      return { ...base, buckets: buildLikertBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "dropdown") {
      const counts = new Map<string, BucketCounts>();
      for (const [, label] of optionLabels) {
        counts.set(label, emptyCounts());
      }
      for (const a of answers) {
        const optionId = parseMcSingle(a.answer);
        if (!optionId) continue;
        const label = optionLabels.get(optionId) ?? `(삭제된 보기: ${optionId.slice(0, 8)}…)`;
        const c = counts.get(label) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(label, c);
      }
      const entries = [...counts.entries()].map(([label, counts]) => ({
        key: label,
        label,
        counts,
      }));
      return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "rank") {
      const counts = new Map<string, BucketCounts>();
      for (const a of answers) {
        const label = parseRank(a.answer, optionLabels);
        if (!label) continue;
        const c = counts.get(label) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(label, c);
      }
      const entries = [...counts.entries()].map(([label, counts]) => ({
        key: label,
        label,
        counts,
      }));
      return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "likert_multi") {
      const scaleSize = clampLikertScaleSize(q.max_selections);
      const counts = new Map<string, BucketCounts>();
      for (const a of answers) {
        const label = parseLikertMulti(a.answer, optionLabels, scaleSize);
        if (!label) continue;
        const c = counts.get(label) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(label, c);
      }
      const entries = [...counts.entries()].map(([label, counts]) => ({
        key: label,
        label,
        counts,
      }));
      return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "star_rating") {
      const starValues = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
      const counts = new Map<number, BucketCounts>();
      for (const v of starValues) {
        counts.set(v, emptyCounts());
      }
      for (const a of answers) {
        const value = parseStarRating(a.answer);
        if (value == null) continue;
        const c = counts.get(value) ?? emptyCounts();
        bump(c, a.kind);
        counts.set(value, c);
      }
      const entries = starValues.map((v) => ({
        key: String(v),
        label: `${v}점`,
        counts: counts.get(v) ?? emptyCounts(),
      }));
      return { ...base, buckets: buildLikertBuckets(totalSubmissions, noAnswer, entries) };
    }

    if (type === "info_media") {
      return {
        ...base,
        buckets: buildBuckets(totalSubmissions, noAnswer, [
          {
            key: "display",
            label: "안내 문항 (응답 없음)",
            counts: emptyCounts(),
          },
        ]),
      };
    }

    if (type === "contact_fields") {
      const answered = emptyCounts();
      for (const a of answers) {
        if (!a.answer || typeof a.answer !== "object") continue;
        const values = (a.answer as { values?: Record<string, string> }).values;
        if (!values || typeof values !== "object") continue;
        const has = Object.values(values).some((v) => (v ?? "").trim().length > 0);
        if (has) bump(answered, a.kind);
      }
      return {
        ...base,
        buckets: buildBuckets(totalSubmissions, noAnswer, [
          { key: "answered", label: "항목 입력 완료", counts: answered },
        ]),
      };
    }

    return { ...base, buckets: buildBuckets(totalSubmissions, noAnswer, []) };
  });

  const durationSeconds = responses
    .map((r) => r.duration_seconds)
    .filter((s): s is number => typeof s === "number" && Number.isFinite(s) && s >= 0);

  return {
    ok: true,
    slug: survey.slug,
    title: survey.title,
    totalSubmissions,
    duration:
      durationSeconds.length > 0
        ? summarizeDurations(durationSeconds, totalSubmissions)
        : emptyDurationSummary(totalSubmissions),
    questions: questionStats,
  };
}
