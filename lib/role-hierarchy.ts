import {
  INTERNAL_STAFF_ROLES,
  ROLE_LABELS,
  type InternalStaffRole,
  type StaffRole,
} from "@/lib/roles";

/** 낮을수록 하위 등급 */
const ROLE_RANK: Record<StaffRole, number> = {
  guest: 0,
  employee: 1,
  team_lead: 2,
  sub_admin: 3,
  super_admin: 4,
};

export function getRoleRank(role: string): number {
  if (role in ROLE_RANK) {
    return ROLE_RANK[role as StaffRole];
  }
  return -1;
}

/** 본인보다 낮은 등급의 계정만 관리 대상 */
export function canManageProfile(
  actorUserId: string,
  actorRole: string,
  targetUserId: string,
  targetRole: string,
): boolean {
  if (actorUserId === targetUserId) return false;
  const actorRank = getRoleRank(actorRole);
  const targetRank = getRoleRank(targetRole);
  if (actorRank < 0 || targetRank < 0) return false;
  return targetRank < actorRank;
}

/** 부여할 수 있는 role (본인 등급 이하, 직원 계열) */
export function getAssignableRoles(actorRole: string): InternalStaffRole[] {
  const actorRank = getRoleRank(actorRole);
  if (actorRank < 0) return [];
  return INTERNAL_STAFF_ROLES.filter((r) => getRoleRank(r) <= actorRank);
}

export function canAssignRole(actorRole: string, newRole: string): boolean {
  if (!INTERNAL_STAFF_ROLES.includes(newRole as InternalStaffRole)) {
    return false;
  }
  const actorRank = getRoleRank(actorRole);
  const newRank = getRoleRank(newRole);
  return actorRank >= 0 && newRank >= 0 && newRank <= actorRank;
}

export function roleLabel(role: string): string {
  return role in ROLE_LABELS ? ROLE_LABELS[role as StaffRole] : role;
}
