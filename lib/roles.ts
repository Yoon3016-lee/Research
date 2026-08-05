/** DB `profiles.role` 과 동일한 값 */
export const STAFF_ROLES = [
  "super_admin",
  "sub_admin",
  "team_lead",
  "employee",
  "guest",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "총관리자",
  sub_admin: "서브관리자",
  team_lead: "팀장",
  employee: "직원",
  guest: "게스트·일반",
};

/** 설문 작업량에「직원」으로 집계되는 역할 */
export const INTERNAL_STAFF_ROLES = [
  "super_admin",
  "sub_admin",
  "team_lead",
  "employee",
] as const;

export type InternalStaffRole = (typeof INTERNAL_STAFF_ROLES)[number];

export function isStaffRole(role: string): role is InternalStaffRole {
  return (INTERNAL_STAFF_ROLES as readonly string[]).includes(role);
}

/** 설문 참여 화면에서 Advisor Agent(응답 스크립트) 팝업 — 직원(employee) 이상 */
export function canViewResponseScript(role: string | null | undefined): boolean {
  return !!role && isStaffRole(role);
}

/** 관리자 페이지(`/admin`) 접근 가능 역할 */
export const ADMIN_PANEL_ROLES = ["super_admin", "sub_admin"] as const;

export type AdminPanelRole = (typeof ADMIN_PANEL_ROLES)[number];

export function canAccessAdminPanel(role: string | null | undefined): boolean {
  if (!role) return false;
  return (ADMIN_PANEL_ROLES as readonly string[]).includes(role);
}
