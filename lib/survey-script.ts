import "server-only";

import { canViewResponseScript } from "@/lib/roles";
import { getSurveyParticipant } from "@/lib/participant";
import { listSharedResponseScripts, type SharedResponseScript } from "@/lib/shared-scripts";
import { normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SurveyScriptLoad =
  | {
      ok: true;
      title: string;
      slug: string;
      responseScript: string;
      sharedScripts: SharedResponseScript[];
    }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "forbidden" };

/** 직원(employee) 이상 로그인 시에만 스크립트 본문 조회 */
export async function loadSurveyResponseScript(
  slug: string,
): Promise<SurveyScriptLoad> {
  const normalized = normalizeSurveyRef(slug);
  if (!normalized) {
    return { ok: false, reason: "not_found" };
  }

  const participant = await getSurveyParticipant();
  if (participant.mode !== "staff" || !canViewResponseScript(participant.role)) {
    return { ok: false, reason: "forbidden" };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, reason: "not_found" };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("surveys")
    .select("slug, title, response_script")
    .eq("slug", normalized)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }

  const sharedScripts = await listSharedResponseScripts();

  return {
    ok: true,
    slug: data.slug as string,
    title: data.title as string,
    responseScript: (data.response_script as string) ?? "",
    sharedScripts,
  };
}
