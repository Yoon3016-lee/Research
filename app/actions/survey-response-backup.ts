"use server";

import { revalidatePath } from "next/cache";
import {
  createSurveyResponseBackup,
  listSurveyBackupSummaries,
  listSurveyBackupsForSurvey,
} from "@/lib/survey-response-backup";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type BackupActionState = { error?: string; ok?: boolean };

export async function createSurveyBackupAction(
  _prev: BackupActionState,
  formData: FormData,
): Promise<BackupActionState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버 설정이 완료되지 않았습니다." };
  }

  const { userId } = await requireAdminPanelAccess();
  const survey = String(formData.get("survey") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();

  if (!survey) return { error: "설문을 지정하세요." };

  const admin = createSupabaseServiceRoleClient();
  const result = await createSurveyResponseBackup(admin, survey, "manual", {
    label,
    createdBy: userId,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/backups");
  return { ok: true };
}

export async function loadBackupSummariesAction(): Promise<
  Awaited<ReturnType<typeof listSurveyBackupSummaries>>
> {
  await requireAdminPanelAccess();
  return listSurveyBackupSummaries();
}

export async function loadSurveyBackupsAction(surveyRef: string) {
  await requireAdminPanelAccess();
  return listSurveyBackupsForSurvey(surveyRef);
}
