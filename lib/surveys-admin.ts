import "server-only";

import type { CreateSurveyPayload, DraftQuestion, QuestionType } from "@/lib/survey-types";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SurveyEditBundle = CreateSurveyPayload & {
  slug: string;
  responseCount: number;
};

export type SurveyEditLoad =
  | { ok: true; bundle: SurveyEditBundle }
  | { ok: false; reason: "not_configured" | "not_found" | "db_error"; message?: string };

type SurveyRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  period_label: string;
  target_count: number;
  status: string;
  listed_public: boolean;
  response_count: number;
  response_script: string;
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
  question_id: string;
  order_index: number;
  label: string;
};

async function fetchSurveyRow(
  ref: string,
): Promise<{ row: SurveyRow | null; errorMessage?: string }> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) {
    return { row: null };
  }

  const select =
    "id, slug, title, summary, period_label, target_count, status, listed_public, response_count, response_script";

  const bySlug = await admin.from("surveys").select(select).eq("slug", normalized).maybeSingle();
  if (bySlug.error) {
    console.error("[getSurveyForEdit] slug lookup:", bySlug.error.message);
    return { row: null, errorMessage: bySlug.error.message };
  }
  if (bySlug.data) {
    return { row: bySlug.data as SurveyRow };
  }

  if (isUuid(normalized)) {
    const byId = await admin.from("surveys").select(select).eq("id", normalized).maybeSingle();
    if (byId.error) {
      console.error("[getSurveyForEdit] id lookup:", byId.error.message);
      return { row: null, errorMessage: byId.error.message };
    }
    if (byId.data) {
      return { row: byId.data as SurveyRow };
    }
  }

  return { row: null };
}

export async function loadSurveyForEdit(ref: string): Promise<SurveyEditLoad> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, reason: "not_configured" };
  }

  let surveyRow: SurveyRow | null;
  try {
    const fetched = await fetchSurveyRow(ref);
    surveyRow = fetched.row;
    if (!surveyRow && fetched.errorMessage) {
      return { ok: false, reason: "db_error", message: fetched.errorMessage };
    }
  } catch (err) {
    console.error("[loadSurveyForEdit]", err);
    return { ok: false, reason: "db_error" };
  }

  if (!surveyRow) {
    return { ok: false, reason: "not_found" };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: qRows, error: qError } = await admin
    .from("survey_questions")
    .select(
      "id, order_index, prompt, question_type, allow_skip, max_selections, text_line_count",
    )
    .eq("survey_id", surveyRow.id)
    .order("order_index", { ascending: true });

  if (qError) {
    console.error("[loadSurveyForEdit] questions:", qError.message);
  }

  const questions = (qRows ?? []) as QuestionRow[];
  const questionIds = questions.map((q) => q.id);
  let optionRows: OptionRow[] = [];

  if (questionIds.length > 0) {
    const { data: opts, error: oError } = await admin
      .from("survey_question_options")
      .select("question_id, order_index, label")
      .in("question_id", questionIds)
      .order("order_index", { ascending: true });

    if (oError) {
      console.error("[loadSurveyForEdit] options:", oError.message);
    } else {
      optionRows = (opts ?? []) as OptionRow[];
    }
  }

  const optionsByQuestion = new Map<string, string[]>();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push(o.label);
    optionsByQuestion.set(o.question_id, list);
  }

  const draftQuestions: DraftQuestion[] = questions.map((q) => {
    const type = q.question_type as QuestionType;
    const opts = optionsByQuestion.get(q.id) ?? [];
    return {
      clientId: q.id,
      type,
      prompt: q.prompt,
      allowSkip: q.allow_skip,
      options: opts.length > 0 ? opts : type === "mc_single" || type === "mc_multi" ? ["", ""] : [],
      maxSelections: q.max_selections ?? Math.min(2, opts.length || 2),
      textLineCount: q.text_line_count ?? (type === "text_multi" ? 2 : 1),
    };
  });

  return {
    ok: true,
    bundle: {
      slug: surveyRow.slug,
      responseCount: surveyRow.response_count,
      title: surveyRow.title,
      summary: surveyRow.summary,
      periodLabel: surveyRow.period_label,
      targetCount: surveyRow.target_count,
      listedPublic: surveyRow.listed_public,
      status: surveyRow.status as "예정" | "진행중" | "종료",
      responseScript: surveyRow.response_script ?? "",
      questions: draftQuestions,
    },
  };
}

/** @deprecated loadSurveyForEdit 사용 */
export async function getSurveyForEdit(ref: string): Promise<SurveyEditBundle | null> {
  const loaded = await loadSurveyForEdit(ref);
  return loaded.ok ? loaded.bundle : null;
}
