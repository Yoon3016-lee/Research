"use server";

import {
  deleteSurveyCreateDraftForCurrentUser,
  saveSurveyCreateDraftForCurrentUser,
} from "@/lib/survey-create-draft-db";

export async function saveSurveyCreateDraftAction(payload: unknown): Promise<
  { ok: true; savedAt: string } | { ok: false; error: string }
> {
  return saveSurveyCreateDraftForCurrentUser(payload);
}

export async function deleteSurveyCreateDraftAction(): Promise<void> {
  await deleteSurveyCreateDraftForCurrentUser();
}
