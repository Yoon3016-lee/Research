import "server-only";

import {
  MAX_SURVEY_CREATE_DRAFT_CHARS,
  normalizeCreateDraftPayload,
  type StoredSurveyCreateDraft,
} from "@/lib/survey-create-draft";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export async function loadSurveyCreateDraftForCurrentUser(): Promise<StoredSurveyCreateDraft | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const { userId } = await requireAdminPanelAccess();
  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_create_drafts")
    .select("payload, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const payload = normalizeCreateDraftPayload(data.payload);
  if (!payload) return null;
  return {
    savedAt:
      typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
    payload,
  };
}

export async function saveSurveyCreateDraftForCurrentUser(
  rawPayload: unknown,
): Promise<{ ok: true; savedAt: string } | { ok: false; error: string }> {
  const payload = normalizeCreateDraftPayload(rawPayload);
  if (!payload) return { ok: false, error: "저장할 내용이 없습니다." };

  const json = JSON.stringify(payload);
  if (json.length > MAX_SURVEY_CREATE_DRAFT_CHARS) {
    return { ok: false, error: "초안이 너무 커서 계정에 저장하지 못했습니다." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "서버에 Service Role 키가 없습니다." };
  }

  const { userId } = await requireAdminPanelAccess();
  const admin = createSupabaseServiceRoleClient();
  const savedAt = new Date().toISOString();
  const { error } = await admin.from("survey_create_drafts").upsert(
    {
      user_id: userId,
      payload,
      updated_at: savedAt,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    if (error.message.includes("survey_create_drafts")) {
      return {
        ok: false,
        error: "초안 저장 테이블이 없습니다. 마이그레이션을 실행하세요.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, savedAt };
}

export async function deleteSurveyCreateDraftForCurrentUser(): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const { userId } = await requireAdminPanelAccess();
  const admin = createSupabaseServiceRoleClient();
  await admin.from("survey_create_drafts").delete().eq("user_id", userId);
}
