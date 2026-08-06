"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type DeleteSurveyState =
  | { error: string; ok?: undefined }
  | { ok: true; error?: undefined };

/**
 * 설문 삭제. 응답 답변은 question_id RESTRICT 때문에
 * 설문 CASCADE만으로는 삭제 순서 문제가 생길 수 있어 답변·응답을 먼저 제거합니다.
 */
export async function deleteSurveyAction(
  slug: string,
): Promise<DeleteSurveyState> {
  await requireAdminPanelAccess();

  const trimmed = slug?.trim();
  if (!trimmed) return { error: "설문 ID가 없습니다." };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: existing, error: findErr } = await admin
    .from("surveys")
    .select("id, slug, title")
    .eq("slug", trimmed)
    .maybeSingle();

  if (findErr) return { error: findErr.message };
  if (!existing) return { error: "설문을 찾을 수 없습니다." };

  const surveyId = existing.id as string;

  const { data: responseRows, error: responseListErr } = await admin
    .from("survey_responses")
    .select("id")
    .eq("survey_id", surveyId);

  if (responseListErr) {
    return { error: responseListErr.message };
  }

  const responseIds = (responseRows ?? []).map((r) => r.id as string);

  if (responseIds.length > 0) {
    const { error: answersErr } = await admin
      .from("survey_response_answers")
      .delete()
      .in("response_id", responseIds);

    if (answersErr) {
      return {
        error:
          answersErr.message.includes("foreign key") ||
          answersErr.message.includes("restrict")
            ? "응답 답변을 삭제하지 못했습니다. 잠시 후 다시 시도하거나 응답 백업에서 데이터를 확인하세요."
            : answersErr.message,
      };
    }

    const { error: responsesErr } = await admin
      .from("survey_responses")
      .delete()
      .eq("survey_id", surveyId);

    if (responsesErr) {
      return { error: responsesErr.message };
    }
  }

  // FK 없음 — 정리용
  await admin.from("survey_response_archives").delete().eq("survey_id", surveyId);

  const { error } = await admin.from("surveys").delete().eq("id", surveyId);
  if (error) {
    if (
      error.message.includes("foreign key") ||
      error.message.includes("survey_response_answers_question_id_fkey")
    ) {
      return {
        error:
          "설문을 삭제하지 못했습니다. 연결된 응답 데이터가 남아 있을 수 있습니다. 관리자에게 문의하세요.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/progress");
  revalidatePath("/admin/backups");
  revalidatePath("/surveys");
  revalidatePath(`/survey/${trimmed}`);

  return { ok: true };
}
