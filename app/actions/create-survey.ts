"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { CreateSurveyPayload } from "@/lib/survey-types";
import { buildSurveyPeriodPersist } from "@/lib/survey-period";
import { persistSurveyQuestions, validateQuestion } from "@/lib/survey-persist";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

function makeSlug(title: string): string {
  const t = title
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .slice(0, 48);
  const base = t.length > 0 ? t : "survey";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export type CreateSurveyState =
  | { error: string; ok?: undefined; slug?: undefined }
  | { ok: true; slug: string; error?: undefined };

export async function createSurveyAction(
  payload: CreateSurveyPayload,
): Promise<CreateSurveyState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  await requireAdminPanelAccess();

  const title = payload.title.trim();
  if (!title) {
    return { error: "설문 제목을 입력하세요." };
  }
  if (!payload.questions.length) {
    return { error: "문항을 1개 이상 추가하세요." };
  }

  for (let i = 0; i < payload.questions.length; i++) {
    const err = validateQuestion(payload.questions[i], i);
    if (err) return { error: err };
  }

  const periodBuilt = buildSurveyPeriodPersist(payload.periodStart, payload.periodEnd);
  if (!periodBuilt.ok) return { error: periodBuilt.error };

  const admin = createSupabaseServiceRoleClient();
  const slug = makeSlug(title);

  const { data: survey, error: surveyError } = await admin
    .from("surveys")
    .insert({
      slug,
      title,
      summary: payload.summary.trim(),
      period_start: periodBuilt.data.periodStart,
      period_end: periodBuilt.data.periodEnd,
      period_label: periodBuilt.data.periodLabel,
      target_count: Math.max(0, payload.targetCount),
      status: periodBuilt.data.status,
      listed_public: payload.listedPublic,
      response_script: payload.responseScript.trim(),
      response_count: 0,
    })
    .select("id")
    .single();

  if (surveyError || !survey) {
    const msg = surveyError?.message ?? "설문 저장에 실패했습니다.";
    if (msg.includes("response_script")) {
      return {
        error:
          "DB에 response_script 컬럼이 없습니다. Supabase 대시보드 → SQL Editor에서 supabase/migrations/20260407200000_survey_response_script.sql 내용을 실행한 뒤 다시 저장하세요.",
      };
    }
    if (msg.includes("period_start") || msg.includes("period_end")) {
      return {
        error:
          "DB에 period_start·period_end 컬럼이 없습니다. supabase/migrations/20260407270000_survey_period_dates.sql 을 실행한 뒤 다시 저장하세요.",
      };
    }
    return { error: msg };
  }

  const persistError = await persistSurveyQuestions(
    admin,
    survey.id as string,
    payload.questions,
  );
  if (persistError) {
    return { error: persistError };
  }

  revalidatePath("/admin/surveys");
  revalidatePath("/surveys");
  revalidatePath(`/survey-script/${slug}`);
  return { ok: true, slug };
}
