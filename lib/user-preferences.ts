import "server-only";

import {
  DEFAULT_SURVEY_VIEW_MODE,
  isSurveyViewMode,
  type SurveyViewMode,
} from "@/lib/survey-view-mode";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export async function getSurveyViewModeForUser(
  userId: string | null | undefined,
): Promise<SurveyViewMode> {
  if (!userId || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return DEFAULT_SURVEY_VIEW_MODE;
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("survey_view_mode")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_SURVEY_VIEW_MODE;
  const value = data.survey_view_mode;
  return isSurveyViewMode(value) ? value : DEFAULT_SURVEY_VIEW_MODE;
}

export async function setSurveyViewModeForUser(
  userId: string,
  mode: SurveyViewMode,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "서버 설정이 완료되지 않았습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("profiles")
    .update({ survey_view_mode: mode, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
