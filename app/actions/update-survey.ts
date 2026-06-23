"use server";

import { revalidatePath } from "next/cache";
import type { CreateSurveyPayload } from "@/lib/survey-types";
import { buildSurveyPeriodPersist } from "@/lib/survey-period";
import { normalizeSurveyRef } from "@/lib/survey-slug";
import { persistSurveyQuestions, validateQuestion } from "@/lib/survey-persist";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type UpdateSurveyState =
  | { error: string; ok?: undefined; slug?: undefined }
  | { ok: true; slug: string; error?: undefined };

export async function updateSurveyAction(
  slug: string,
  payload: CreateSurveyPayload,
): Promise<UpdateSurveyState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  await requireAdminPanelAccess();

  const normalizedSlug = normalizeSurveyRef(slug);
  const title = payload.title.trim();
  if (!title) {
    return { error: "설문 제목을 입력하세요." };
  }
  if (!payload.questions.length) {
    return { error: "문항을 1개 이상 추가하세요." };
  }

  for (let i = 0; i < payload.questions.length; i++) {
    const err = validateQuestion(payload.questions[i], i, payload.questions);
    if (err) return { error: err };
  }

  const periodBuilt = buildSurveyPeriodPersist(payload.periodStart, payload.periodEnd);
  if (!periodBuilt.ok) return { error: periodBuilt.error };

  const admin = createSupabaseServiceRoleClient();
  const { data: existing, error: findError } = await admin
    .from("surveys")
    .select("id, slug, response_count")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (findError || !existing) {
    return { error: "설문을 찾을 수 없습니다." };
  }

  const surveyId = existing.id as string;

  const { error: updateError } = await admin
    .from("surveys")
    .update({
      title,
      summary: payload.summary.trim(),
      period_start: periodBuilt.data.periodStart,
      period_end: periodBuilt.data.periodEnd,
      period_label: periodBuilt.data.periodLabel,
      target_count: Math.max(0, payload.targetCount),
      status: periodBuilt.data.status,
      listed_public: payload.listedPublic,
      response_script: payload.responseScript.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", surveyId);

  if (updateError) {
    if (updateError.message.includes("response_script")) {
      return {
        error:
          "DB에 response_script 컬럼이 없습니다. Supabase SQL Editor에서 supabase/migrations/20260407200000_survey_response_script.sql 을 실행하세요.",
      };
    }
    if (
      updateError.message.includes("period_start") ||
      updateError.message.includes("period_end")
    ) {
      return {
        error:
          "DB에 period_start·period_end 컬럼이 없습니다. supabase/migrations/20260407270000_survey_period_dates.sql 을 실행하세요.",
      };
    }
    return { error: updateError.message };
  }

  const { error: deleteError } = await admin
    .from("survey_questions")
    .delete()
    .eq("survey_id", surveyId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const persistError = await persistSurveyQuestions(admin, surveyId, payload.questions);
  if (persistError) {
    return { error: persistError };
  }

  revalidatePath("/admin/surveys");
  revalidatePath("/admin/surveys/edit");
  revalidatePath("/surveys");
  revalidatePath(`/survey/${normalizedSlug}`);
  revalidatePath(`/survey-script/${normalizedSlug}`);

  return { ok: true, slug: normalizedSlug };
}
