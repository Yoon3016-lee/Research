"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SurveyScriptActionState = {
  error?: string;
  ok?: boolean;
};

function revalidateSurveyScriptPaths(slug: string) {
  revalidatePath("/admin/surveys");
  revalidatePath(`/survey/${slug}`);
  revalidatePath("/survey-script", "layout");
}

export async function updateSurveyResponseScriptAction(
  _prev: SurveyScriptActionState,
  formData: FormData,
): Promise<SurveyScriptActionState> {
  await requireAdminPanelAccess();

  const slug = normalizeSurveyRef(String(formData.get("slug") ?? ""));
  if (!slug) {
    return { error: "설문 slug가 없습니다." };
  }

  const responseScript = String(formData.get("response_script") ?? "");

  const admin = createSupabaseServiceRoleClient();
  const { data: existing, error: findError } = await admin
    .from("surveys")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (findError || !existing) {
    return { error: "설문을 찾을 수 없습니다." };
  }

  const { error } = await admin
    .from("surveys")
    .update({
      response_script: responseScript.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    if (error.message.includes("response_script")) {
      return {
        error:
          "DB에 response_script 컬럼이 없습니다. supabase/migrations/20260407200000_survey_response_script.sql 을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  revalidateSurveyScriptPaths(slug);
  return { ok: true };
}
