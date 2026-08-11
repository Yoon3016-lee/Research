"use server";

import { revalidatePath } from "next/cache";
import type { CreateSurveyPayload } from "@/lib/survey-types";
import { buildSurveyPeriodPersist } from "@/lib/survey-period";
import { normalizeSurveyRef } from "@/lib/survey-slug";
import { persistSurveyQuestionsUpdate, validateQuestion } from "@/lib/survey-persist";
import {
  forkSurveyOnEdit,
  surveyHasStoredResponses,
  surveyQuestionsContentEqual,
} from "@/lib/survey-version";
import { loadSurveyForEdit } from "@/lib/surveys-admin";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type UpdateSurveyState =
  | { error: string; ok?: undefined; slug?: undefined; forked?: undefined; previousSlug?: undefined }
  | { ok: true; slug: string; forked?: boolean; previousSlug?: string; error?: undefined };

export async function updateSurveyAction(
  slug: string,
  payload: CreateSurveyPayload,
): Promise<UpdateSurveyState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const { userId } = await requireAdminPanelAccess();

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

  type ExistingSurveyRow = {
    id: string;
    slug: string;
    title: string;
    response_count: number;
    root_survey_id?: string | null;
  };

  let existing: ExistingSurveyRow | null = null;

  const selectWithVersion =
    "id, slug, title, response_count, root_survey_id";
  const selectBasic = "id, slug, title, response_count";

  const primary = await admin
    .from("surveys")
    .select(selectWithVersion)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (primary.error?.message && primary.error.message.includes("root_survey_id")) {
    const fallback = await admin
      .from("surveys")
      .select(selectBasic)
      .eq("slug", normalizedSlug)
      .maybeSingle();
    if (fallback.error || !fallback.data) {
      return { error: "설문을 찾을 수 없습니다." };
    }
    existing = fallback.data as ExistingSurveyRow;
  } else if (primary.error || !primary.data) {
    return { error: "설문을 찾을 수 없습니다." };
  } else {
    existing = primary.data as ExistingSurveyRow;
  }

  if (!existing) {
    return { error: "설문을 찾을 수 없습니다." };
  }

  const surveyId = existing.id;
  const hasResponses = await surveyHasStoredResponses(
    admin,
    surveyId,
    existing.response_count ?? 0,
  );

  let questionsUnchangedWithResponses = false;

  if (hasResponses) {
    const loaded = await loadSurveyForEdit(normalizedSlug);
    const existingQuestions =
      loaded.ok && loaded.bundle ? loaded.bundle.questions : null;
    const questionsChanged =
      !existingQuestions ||
      !surveyQuestionsContentEqual(existingQuestions, payload.questions);

    if (questionsChanged) {
      const forkResult = await forkSurveyOnEdit(admin, existing, payload, {
        createdBy: userId,
      });
      if (!forkResult.ok) {
        return { error: forkResult.error };
      }

      revalidatePaths(normalizedSlug, forkResult.slug, forkResult.previousSlug);

      return {
        ok: true,
        slug: forkResult.slug,
        forked: true,
        previousSlug: forkResult.previousSlug,
      };
    }
    // 문항 동일 → 제목·기간 등 메타만 기존 설문에 반영 (버전 분기 없음)
    questionsUnchangedWithResponses = true;
  }

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
      ksic_code: (payload.ksicCode ?? "").trim(),
      ksic_name: (payload.ksicName ?? "").trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", surveyId);

  if (updateError) {
    return { error: formatSurveyUpdateError(updateError.message) };
  }

  // 응답 있는 설문에서 문항이 같으면 문항/보기 ID를 건드리지 않음
  if (!questionsUnchangedWithResponses) {
    const persistError = await persistSurveyQuestionsUpdate(
      admin,
      surveyId,
      payload.questions,
    );
    if (persistError) {
      return { error: persistError };
    }
  }

  revalidatePaths(normalizedSlug);

  return { ok: true, slug: normalizedSlug };
}

function formatSurveyUpdateError(message: string): string {
  if (message.includes("response_script")) {
    return "DB에 response_script 컬럼이 없습니다. supabase/migrations/20260407200000_survey_response_script.sql 을 실행하세요.";
  }
  if (message.includes("period_start") || message.includes("period_end")) {
    return "DB에 period_start·period_end 컬럼이 없습니다. supabase/migrations/20260407270000_survey_period_dates.sql 을 실행하세요.";
  }
  if (message.includes("ksic_code") || message.includes("ksic_name")) {
    return "DB에 ksic_code·ksic_name 컬럼이 없습니다. supabase/migrations/20260409000000_surveys_ksic.sql 을 실행하세요.";
  }
  return message;
}

function revalidatePaths(...slugs: string[]) {
  revalidatePath("/admin/backups");
  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/surveys/edit");
  revalidatePath("/admin/surveys/logic");
  revalidatePath("/admin/progress");
  revalidatePath("/surveys");

  for (const s of slugs) {
    if (!s) continue;
    revalidatePath(`/survey/${s}`);
    revalidatePath(`/survey-script/${s}`);
  }
}
