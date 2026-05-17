"use server";

import { revalidatePath } from "next/cache";
import {
  canAssignRole,
  canManageProfile,
} from "@/lib/role-hierarchy";
import { INTERNAL_STAFF_ROLES, type InternalStaffRole } from "@/lib/roles";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type UpdateProfileRoleState =
  | { ok: true; error?: undefined }
  | { ok?: undefined; error: string };

export async function updateProfileRoleAction(
  profileId: string,
  newRole: string,
): Promise<UpdateProfileRoleState> {
  const actor = await requireAdminPanelAccess();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버 설정이 완료되지 않았습니다." };
  }

  const targetId = profileId.trim();
  if (!targetId) {
    return { error: "대상 사용자를 지정하지 않았습니다." };
  }

  if (!(INTERNAL_STAFF_ROLES as readonly string[]).includes(newRole)) {
    return { error: "허용되지 않는 역할입니다." };
  }

  const newStaffRole = newRole as InternalStaffRole;

  if (!canAssignRole(actor.role, newStaffRole)) {
    return { error: "본인 등급보다 높은 역할로는 변경할 수 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: target, error: fetchError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", targetId)
    .maybeSingle();

  if (fetchError || !target) {
    return { error: "사용자를 찾을 수 없습니다." };
  }

  const currentRole = target.role as string;
  if (!canManageProfile(actor.userId, actor.role, targetId, currentRole)) {
    return {
      error:
        "본인보다 낮은 등급의 사용자만 변경할 수 있습니다. (본인 계정은 변경할 수 없습니다.)",
    };
  }

  if (currentRole === newStaffRole) {
    return { ok: true };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      role: newStaffRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/staff");
  revalidatePath("/", "layout");

  return { ok: true };
}
