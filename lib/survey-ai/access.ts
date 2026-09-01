import "server-only";

import { requireAdminPanelAccess } from "@/lib/require-admin";

/** 관리자 패널 vs 공개 발표·체험(비로그인 허용) */
export type SurveyAiAccess = "admin" | "demo";

export async function assertSurveyAiAccess(
  access: SurveyAiAccess = "admin",
): Promise<void> {
  if (access === "admin") {
    await requireAdminPanelAccess();
    return;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("서버 설정이 없어 RKME 체험을 사용할 수 없습니다.");
  }
}
