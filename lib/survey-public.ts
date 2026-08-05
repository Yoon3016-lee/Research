import "server-only";

import type { QuestionType } from "@/lib/survey-types";
import { resolveSurveyStatus, normalizeStoredDate } from "@/lib/survey-period";
import {
  parseStoredVisibilityRules,
  resolveVisibilityRulesForPublic,
  type ResolvedVisibilityRule,
} from "@/lib/survey-visibility";
import { syncSurveyPeriodStatuses } from "@/lib/sync-survey-statuses";
import { normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicSurveyOption = {
  id: string;
  label: string;
  isOther: boolean;
  /** true면 선택 시 이후 문항 없이 조사 종료 */
  endsSurvey: boolean;
};

export type PublicSurveyQuestion = {
  id: string;
  orderIndex: number;
  type: QuestionType;
  prompt: string;
  allowSkip: boolean;
  staffOnly: boolean;
  visibilityRules: ResolvedVisibilityRule[];
  maxSelections: number | null;
  textLineCount: number | null;
  options: PublicSurveyOption[];
  infoBody: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
};

export type PublicSurveyDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  periodLabel: string;
  ksicCode: string;
  ksicName: string;
  questions: PublicSurveyQuestion[];
};

export type SurveyAnswerInput =
  | { questionId: string; type: "mc_single"; optionId: string; otherText?: string }
  | { questionId: string; type: "mc_multi"; optionIds: string[]; otherText?: string }
  | { questionId: string; type: "text_single"; text: string }
  | { questionId: string; type: "text_multi"; values: Record<string, string>; lines?: string[] }
  | { questionId: string; type: "likert_7"; value: number }
  | { questionId: string; type: "dropdown"; optionId: string }
  | { questionId: string; type: "rank"; rankedOptionIds: string[] }
  | { questionId: string; type: "likert_multi"; values: Record<string, number> }
  | { questionId: string; type: "star_rating"; value: number }
  | { questionId: string; type: "contact_fields"; values: Record<string, string> };

export type SurveyParticipationLoad =
  | { ok: true; survey: PublicSurveyDetail }
  | { ok: false; reason: "not_found" }
  | {
      ok: false;
      reason: "not_open";
      title: string;
      status: string;
      listedPublic: boolean;
    };

type SurveyRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  listed_public: boolean;
  ksic_code?: string | null;
  ksic_name?: string | null;
};

function effectiveSurveyStatus(row: SurveyRow): string {
  const start = normalizeStoredDate(row.period_start);
  const end = normalizeStoredDate(row.period_end);
  if (start && end) return resolveSurveyStatus(start, end);
  return row.status;
}

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  allow_skip: boolean;
  staff_only?: boolean;
  visibility_rules?: unknown;
  max_selections: number | null;
  text_line_count: number | null;
  info_body?: string | null;
  media_url?: string | null;
  media_type?: string | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
  is_other?: boolean | null;
  ends_survey?: boolean | null;
};

function mapQuestions(
  qRows: QuestionRow[],
  optionRows: OptionRow[],
): PublicSurveyQuestion[] {
  const optionsByQuestion = new Map<string, PublicSurveyOption[]>();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push({
      id: o.id,
      label: o.label,
      isOther: Boolean(o.is_other),
      endsSurvey: Boolean(o.ends_survey),
    });
    optionsByQuestion.set(o.question_id, list);
  }

  const questionsByOrder = new Map(qRows.map((q) => [q.order_index, { id: q.id }]));

  return qRows.map((q) => {
    const storedRules = parseStoredVisibilityRules(q.visibility_rules);
    return {
      id: q.id,
      orderIndex: q.order_index,
      type: q.question_type as QuestionType,
      prompt: q.prompt,
      allowSkip: q.allow_skip,
      staffOnly: q.staff_only ?? false,
      visibilityRules: resolveVisibilityRulesForPublic(
        q.order_index,
        storedRules,
        questionsByOrder,
      ),
      maxSelections: q.max_selections,
      textLineCount: q.text_line_count,
      options: optionsByQuestion.get(q.id) ?? [],
      infoBody: q.info_body?.trim() || null,
      mediaUrl: q.media_url?.trim() || null,
      mediaType:
        q.media_type === "image" || q.media_type === "video" ? q.media_type : null,
    };
  });
}

async function loadQuestionsForSurvey(
  surveyId: string,
  useServiceRole: boolean,
): Promise<QuestionRow[]> {
  const client = useServiceRole
    ? createSupabaseServiceRoleClient()
    : await createSupabaseServerClient();

  const { data: questions, error: qError } = await client
    .from("survey_questions")
    .select(
      "id, order_index, prompt, question_type, allow_skip, staff_only, visibility_rules, max_selections, text_line_count, info_body, media_url, media_type",
    )
    .eq("survey_id", surveyId)
    .order("order_index", { ascending: true });

  if (qError) {
    if (
      qError.message.includes("info_body") ||
      qError.message.includes("media_url") ||
      qError.message.includes("media_type")
    ) {
      const fallback = await client
        .from("survey_questions")
        .select(
          "id, order_index, prompt, question_type, allow_skip, staff_only, visibility_rules, max_selections, text_line_count",
        )
        .eq("survey_id", surveyId)
        .order("order_index", { ascending: true });
      if (fallback.error) {
        console.error("[loadQuestionsForSurvey]", fallback.error.message);
        return [];
      }
      return (fallback.data ?? []) as QuestionRow[];
    }
    console.error("[loadQuestionsForSurvey]", qError.message);
    return [];
  }

  return (questions ?? []) as QuestionRow[];
}

async function loadOptionsForQuestions(
  questionIds: string[],
  useServiceRole: boolean,
): Promise<OptionRow[]> {
  if (questionIds.length === 0) return [];

  const client = useServiceRole
    ? createSupabaseServiceRoleClient()
    : await createSupabaseServerClient();

  const { data: opts, error: oError } = await client
    .from("survey_question_options")
    .select("id, question_id, order_index, label, is_other, ends_survey")
    .in("question_id", questionIds)
    .order("order_index", { ascending: true });

  if (oError) {
    if (oError.message.includes("ends_survey")) {
      const withoutEnds = await client
        .from("survey_question_options")
        .select("id, question_id, order_index, label, is_other")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true });
      if (withoutEnds.error?.message.includes("is_other")) {
        const fallback = await client
          .from("survey_question_options")
          .select("id, question_id, order_index, label")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true });
        if (fallback.error) {
          console.error("[loadOptionsForQuestions]", fallback.error.message);
          return [];
        }
        return (fallback.data ?? []) as OptionRow[];
      }
      if (withoutEnds.error) {
        console.error("[loadOptionsForQuestions]", withoutEnds.error.message);
        return [];
      }
      return (withoutEnds.data ?? []) as OptionRow[];
    }
    if (oError.message.includes("is_other")) {
      const fallback = await client
        .from("survey_question_options")
        .select("id, question_id, order_index, label")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true });
      if (fallback.error) {
        console.error("[loadOptionsForQuestions]", fallback.error.message);
        return [];
      }
      return (fallback.data ?? []) as OptionRow[];
    }
    console.error("[loadOptionsForQuestions]", oError.message);
    return [];
  }

  return (opts ?? []) as OptionRow[];
}

async function buildSurveyDetail(
  row: SurveyRow,
  useServiceRole: boolean,
): Promise<PublicSurveyDetail> {
  const qRows = await loadQuestionsForSurvey(row.id, useServiceRole);
  const optionRows = await loadOptionsForQuestions(
    qRows.map((q) => q.id),
    useServiceRole,
  );

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    periodLabel: row.period_label,
    ksicCode: (row.ksic_code ?? "").trim(),
    ksicName: (row.ksic_name ?? "").trim(),
    questions: mapQuestions(qRows, optionRows),
  };
}

/** 참여 페이지용 — 설문 없음 / 미공개 / 진행중 아님을 구분 */
export async function loadSurveyForParticipation(
  slug: string,
): Promise<SurveyParticipationLoad> {
  const normalized = normalizeSurveyRef(slug);
  if (!normalized) {
    return { ok: false, reason: "not_found" };
  }

  const useServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (useServiceRole) {
    const admin = createSupabaseServiceRoleClient();
    await syncSurveyPeriodStatuses(admin);

    const selectWithKsic =
      "id, slug, title, summary, period_label, period_start, period_end, status, listed_public, ksic_code, ksic_name";
    const selectBasic =
      "id, slug, title, summary, period_label, period_start, period_end, status, listed_public";

    let row: SurveyRow | null = null;
    let error: { message: string } | null = null;

    const primary = await admin
      .from("surveys")
      .select(selectWithKsic)
      .eq("slug", normalized)
      .maybeSingle();

    if (
      primary.error &&
      (primary.error.message.includes("ksic_code") ||
        primary.error.message.includes("ksic_name"))
    ) {
      const fallback = await admin
        .from("surveys")
        .select(selectBasic)
        .eq("slug", normalized)
        .maybeSingle();
      row = (fallback.data as SurveyRow | null) ?? null;
      error = fallback.error;
    } else {
      row = (primary.data as SurveyRow | null) ?? null;
      error = primary.error;
    }

    if (error) {
      console.error("[loadSurveyForParticipation]", error.message);
      return { ok: false, reason: "not_found" };
    }
    if (!row) return { ok: false, reason: "not_found" };

    const s = row;
    const status = effectiveSurveyStatus(s);
    if (status !== "진행중" || !s.listed_public) {
      return {
        ok: false,
        reason: "not_open",
        title: s.title,
        status,
        listedPublic: s.listed_public,
      };
    }

    return { ok: true, survey: await buildSurveyDetail(s, true) };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, reason: "not_found" };
  }

  const supabase = await createSupabaseServerClient();
  const selectWithKsic =
    "id, slug, title, summary, period_label, period_start, period_end, status, listed_public, ksic_code, ksic_name";
  const selectBasic =
    "id, slug, title, summary, period_label, period_start, period_end, status, listed_public";

  let row: SurveyRow | null = null;
  let error: { message: string } | null = null;

  const primary = await supabase
    .from("surveys")
    .select(selectWithKsic)
    .eq("slug", normalized)
    .eq("listed_public", true)
    .maybeSingle();

  if (
    primary.error &&
    (primary.error.message.includes("ksic_code") ||
      primary.error.message.includes("ksic_name"))
  ) {
    const fallback = await supabase
      .from("surveys")
      .select(selectBasic)
      .eq("slug", normalized)
      .eq("listed_public", true)
      .maybeSingle();
    row = (fallback.data as SurveyRow | null) ?? null;
    error = fallback.error;
  } else {
    row = (primary.data as SurveyRow | null) ?? null;
    error = primary.error;
  }

  if (error) {
    console.error("[loadSurveyForParticipation] anon", error.message);
    return { ok: false, reason: "not_found" };
  }
  if (!row) return { ok: false, reason: "not_found" };

  const s = row;
  const status = effectiveSurveyStatus(s);
  if (status !== "진행중") {
    return {
      ok: false,
      reason: "not_open",
      title: s.title,
      status,
      listedPublic: s.listed_public,
    };
  }

  return { ok: true, survey: await buildSurveyDetail(s, false) };
}

export async function getPublicSurveyBySlug(
  slug: string,
): Promise<PublicSurveyDetail | null> {
  const loaded = await loadSurveyForParticipation(slug);
  if (!loaded.ok) return null;
  return loaded.survey;
}
