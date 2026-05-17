import "server-only";

import {
  canManageProfile,
  getAssignableRoles,
  roleLabel,
} from "@/lib/role-hierarchy";
import { INTERNAL_STAFF_ROLES, type StaffRole } from "@/lib/roles";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type ManageableProfileRow = {
  id: string;
  email: string;
  role: StaffRole;
  roleLabel: string;
  assignableRoles: { value: StaffRole; label: string }[];
};

type ProfileRow = {
  id: string;
  email: string | null;
  role: string;
};

export async function getManageableProfiles(
  actorUserId: string,
  actorRole: string,
): Promise<ManageableProfileRow[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const assignable = getAssignableRoles(actorRole);
  if (assignable.length === 0) return [];

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, role")
    .in("role", [...INTERNAL_STAFF_ROLES])
    .order("role", { ascending: false });

  if (error) {
    console.error("[getManageableProfiles]", error.message);
    return [];
  }

  const assignableOptions = assignable.map((r) => ({
    value: r,
    label: roleLabel(r),
  }));

  return ((data ?? []) as ProfileRow[])
    .filter((row) =>
      canManageProfile(actorUserId, actorRole, row.id, row.role),
    )
    .map((row) => ({
      id: row.id,
      email: row.email?.trim() || "(이메일 없음)",
      role: row.role as StaffRole,
      roleLabel: roleLabel(row.role),
      assignableRoles: assignableOptions,
    }))
    .sort((a, b) => a.email.localeCompare(b.email, "ko"));
}
