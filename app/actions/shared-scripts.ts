"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SharedScriptActionState = {
  error?: string;
  ok?: boolean;
};

function revalidateSharedScriptPaths() {
  revalidatePath("/admin/shared-scripts");
  revalidatePath("/admin/surveys");
  revalidatePath("/survey-script", "layout");
}

export async function createSharedScriptAction(
  formData: FormData,
): Promise<SharedScriptActionState> {
  await requireAdminPanelAccess();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) {
    return { error: "제목을 입력하세요." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: maxRow } = await admin
    .from("shared_response_scripts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const { error } = await admin.from("shared_response_scripts").insert({
    title,
    body,
    sort_order: nextOrder,
  });

  if (error) {
    if (error.message.includes("shared_response_scripts")) {
      return {
        error:
          "DB에 shared_response_scripts 테이블이 없습니다. supabase/migrations/20260407210000_shared_response_scripts.sql 을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  revalidateSharedScriptPaths();
  return { ok: true };
}

export async function updateSharedScriptAction(
  formData: FormData,
): Promise<SharedScriptActionState> {
  await requireAdminPanelAccess();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!id) return { error: "스크립트 ID가 없습니다." };
  if (!title) return { error: "제목을 입력하세요." };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("shared_response_scripts")
    .update({
      title,
      body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateSharedScriptPaths();
  return { ok: true };
}

export async function deleteSharedScriptAction(
  formData: FormData,
): Promise<SharedScriptActionState> {
  await requireAdminPanelAccess();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "스크립트 ID가 없습니다." };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin.from("shared_response_scripts").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateSharedScriptPaths();
  return { ok: true };
}
