"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type DeleteSurveyState =
  | { error: string; ok?: undefined }
  | { ok: true; error?: undefined };

/** slug로 설문 삭제 (문항·응답·표본 등은 FK CASCADE) */
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

  const { error } = await admin.from("surveys").delete().eq("id", existing.id);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/progress");
  revalidatePath("/surveys");
  revalidatePath(`/survey/${trimmed}`);

  return { ok: true };
}
