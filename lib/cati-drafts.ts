import "server-only";

import type { CatiDraft } from "@/lib/cati-sample-types";
import type { SurveyAnswerInput } from "@/lib/survey-public";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

type DraftRow = {
  answers: SurveyAnswerInput[] | null;
  active_question_id: string | null;
  updated_at: string;
};

async function resolveSurveyId(ref: string): Promise<string | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  let query = admin.from("surveys").select("id");
  query = isUuid(normalized) ? query.eq("id", normalized) : query.eq("slug", normalized);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function getCatiDraft(sampleId: string): Promise<CatiDraft | null> {
  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_response_drafts")
    .select("answers, active_question_id, updated_at")
    .eq("sample_id", sampleId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as DraftRow;
  return {
    answers: Array.isArray(row.answers) ? row.answers : [],
    activeQuestionId: row.active_question_id,
    updatedAt: row.updated_at,
  };
}

export async function saveCatiDraft(params: {
  surveyRef: string;
  sampleId: string;
  answers: SurveyAnswerInput[];
  activeQuestionId: string | null;
  updatedBy: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const surveyId = await resolveSurveyId(params.surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: sample } = await admin
    .from("survey_samples")
    .select("id")
    .eq("id", params.sampleId)
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (!sample) {
    return { ok: false, error: "표본을 찾을 수 없습니다." };
  }

  const { error } = await admin.from("survey_response_drafts").upsert(
    {
      survey_id: surveyId,
      sample_id: params.sampleId,
      answers: params.answers,
      active_question_id: params.activeQuestionId,
      updated_by: params.updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sample_id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteCatiDraft(sampleId: string): Promise<void> {
  const admin = createSupabaseServiceRoleClient();
  await admin.from("survey_response_drafts").delete().eq("sample_id", sampleId);
}
