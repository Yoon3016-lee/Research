"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export async function deleteSurveyResponseAction(input: {
  slug: string;
  responseId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminPanelAccess();

  const slug = normalizeSurveyRef(input.slug);
  const responseId = input.responseId.trim();
  if (!slug || !isUuid(responseId)) {
    return { ok: false, error: "삭제할 응답을 찾을 수 없습니다." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const surveyLookup = await admin.from("surveys").select("id, slug").eq("slug", slug).maybeSingle();
  let survey = surveyLookup.data;
  if (!survey && isUuid(slug)) {
    const byId = await admin.from("surveys").select("id, slug").eq("id", slug).maybeSingle();
    survey = byId.data;
  }
  if (!survey) return { ok: false, error: "설문을 찾을 수 없습니다." };

  const { data: response, error: loadError } = await admin
    .from("survey_responses")
    .select("id, survey_id")
    .eq("id", responseId)
    .maybeSingle();

  if (loadError || !response || response.survey_id !== survey.id) {
    return { ok: false, error: "이 설문의 응답이 아닙니다." };
  }

  await admin.from("survey_response_archives").delete().eq("response_id", responseId);

  const { error: deleteError } = await admin.from("survey_responses").delete().eq("id", responseId);
  if (deleteError) return { ok: false, error: deleteError.message };

  const { count } = await admin
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", survey.id);

  await admin
    .from("surveys")
    .update({ response_count: count ?? 0 })
    .eq("id", survey.id);

  revalidatePath("/admin/progress");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin");
  revalidatePath("/surveys");
  revalidatePath(`/survey/${survey.slug}`);

  return { ok: true };
}
