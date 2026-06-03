"use server";

import { loadSurveyForEdit } from "@/lib/surveys-admin";
import { cloneQuestionsAsTemplate } from "@/lib/survey-template";
import type { DraftQuestion } from "@/lib/survey-types";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { normalizeSurveyRef } from "@/lib/survey-slug";

export type LoadSurveyTemplateState =
  | { error: string }
  | {
      ok: true;
      sourceSlug: string;
      sourceTitle: string;
      questions: DraftQuestion[];
    };

export async function loadSurveyTemplateAction(
  slug: string,
): Promise<LoadSurveyTemplateState> {
  await requireAdminPanelAccess();

  const normalized = normalizeSurveyRef(slug);
  if (!normalized) {
    return { error: "설문을 찾을 수 없습니다." };
  }

  const loaded = await loadSurveyForEdit(normalized);
  if (!loaded.ok) {
    if (loaded.reason === "not_configured") {
      return { error: "서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다." };
    }
    return { error: "설문을 찾을 수 없습니다." };
  }

  const { questions, title, slug: sourceSlug } = loaded.bundle;
  if (questions.length === 0) {
    return { error: "선택한 설문에 복사할 문항이 없습니다." };
  }

  return {
    ok: true,
    sourceSlug,
    sourceTitle: title,
    questions: cloneQuestionsAsTemplate(questions),
  };
}
