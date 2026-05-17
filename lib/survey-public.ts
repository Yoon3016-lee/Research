import "server-only";

import type { QuestionType } from "@/lib/survey-types";
import { normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicSurveyOption = {
  id: string;
  label: string;
};

export type PublicSurveyQuestion = {
  id: string;
  orderIndex: number;
  type: QuestionType;
  prompt: string;
  allowSkip: boolean;
  maxSelections: number | null;
  textLineCount: number | null;
  options: PublicSurveyOption[];
};

export type PublicSurveyDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  periodLabel: string;
  questions: PublicSurveyQuestion[];
};

export type SurveyAnswerInput =
  | { questionId: string; type: "mc_single"; optionId: string }
  | { questionId: string; type: "mc_multi"; optionIds: string[] }
  | { questionId: string; type: "text_single"; text: string }
  | { questionId: string; type: "text_multi"; lines: string[] };

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
  status: string;
  listed_public: boolean;
};

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  allow_skip: boolean;
  max_selections: number | null;
  text_line_count: number | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
};

function mapQuestions(
  qRows: QuestionRow[],
  optionRows: OptionRow[],
): PublicSurveyQuestion[] {
  const optionsByQuestion = new Map<string, PublicSurveyOption[]>();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push({ id: o.id, label: o.label });
    optionsByQuestion.set(o.question_id, list);
  }

  return qRows.map((q) => ({
    id: q.id,
    orderIndex: q.order_index,
    type: q.question_type as QuestionType,
    prompt: q.prompt,
    allowSkip: q.allow_skip,
    maxSelections: q.max_selections,
    textLineCount: q.text_line_count,
    options: optionsByQuestion.get(q.id) ?? [],
  }));
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
      "id, order_index, prompt, question_type, allow_skip, max_selections, text_line_count",
    )
    .eq("survey_id", surveyId)
    .order("order_index", { ascending: true });

  if (qError) {
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
    .select("id, question_id, order_index, label")
    .in("question_id", questionIds)
    .order("order_index", { ascending: true });

  if (oError) {
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
    const { data: row, error } = await admin
      .from("surveys")
      .select("id, slug, title, summary, period_label, status, listed_public")
      .eq("slug", normalized)
      .maybeSingle();

    if (error) {
      console.error("[loadSurveyForParticipation]", error.message);
      return { ok: false, reason: "not_found" };
    }
    if (!row) return { ok: false, reason: "not_found" };

    const s = row as SurveyRow;
    if (s.status !== "진행중" || !s.listed_public) {
      return {
        ok: false,
        reason: "not_open",
        title: s.title,
        status: s.status,
        listedPublic: s.listed_public,
      };
    }

    return { ok: true, survey: await buildSurveyDetail(s, true) };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, reason: "not_found" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: row, error } = await supabase
    .from("surveys")
    .select("id, slug, title, summary, period_label, status, listed_public")
    .eq("slug", normalized)
    .eq("status", "진행중")
    .eq("listed_public", true)
    .maybeSingle();

  if (error) {
    console.error("[loadSurveyForParticipation] anon", error.message);
    return { ok: false, reason: "not_found" };
  }
  if (!row) return { ok: false, reason: "not_found" };

  const s = row as SurveyRow;
  return { ok: true, survey: await buildSurveyDetail(s, false) };
}

export async function getPublicSurveyBySlug(
  slug: string,
): Promise<PublicSurveyDetail | null> {
  const loaded = await loadSurveyForParticipation(slug);
  if (!loaded.ok) return null;
  return loaded.survey;
}
