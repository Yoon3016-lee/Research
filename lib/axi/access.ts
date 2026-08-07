import type { SurveyParticipant } from "@/lib/participant-types";
import {
  INTERNAL_STAFF_ROLES,
  ROLE_LABELS,
  STAFF_ROLES,
  type StaffRole,
} from "@/lib/roles";

/** AXI 권한 설정에 쓰는 키 (비로그인 + profiles.role) */
export const AXI_ACCESS_KEYS = ["anonymous", ...STAFF_ROLES] as const;

export type AxiAccessKey = (typeof AXI_ACCESS_KEYS)[number];

export const AXI_ACCESS_LABELS: Record<AxiAccessKey, string> = {
  anonymous: "비로그인",
  ...ROLE_LABELS,
};

/** 마이그레이션 기본값과 동일 — 직원(employee) 이상 */
export const DEFAULT_AXI_ALLOWED_ROLES: AxiAccessKey[] = [
  ...INTERNAL_STAFF_ROLES,
];

export function isAxiAccessKey(value: string): value is AxiAccessKey {
  return (AXI_ACCESS_KEYS as readonly string[]).includes(value);
}

export function parseAxiAllowedRoles(raw: unknown): AxiAccessKey[] {
  if (!Array.isArray(raw)) {
    return [...DEFAULT_AXI_ALLOWED_ROLES];
  }
  const out: AxiAccessKey[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const key = item.trim();
    if (isAxiAccessKey(key) && !out.includes(key)) {
      out.push(key);
    }
  }
  return out.length > 0 ? out : [...DEFAULT_AXI_ALLOWED_ROLES];
}

/** 참여자가 설정된 AXI 권한에 포함되는지 */
export function canUseAxi(
  participant: SurveyParticipant,
  allowedRoles: readonly string[],
): boolean {
  const allowed = parseAxiAllowedRoles(allowedRoles);

  if (participant.mode === "anonymous") {
    return allowed.includes("anonymous");
  }

  if (participant.mode === "guest_account") {
    return allowed.includes("guest");
  }

  if (participant.mode === "staff") {
    const role = participant.role as StaffRole;
    return allowed.includes(role);
  }

  return false;
}
