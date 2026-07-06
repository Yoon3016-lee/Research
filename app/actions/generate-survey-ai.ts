"use server";

import { requireAdminPanelAccess } from "@/lib/require-admin";
import { validateKsicExternalDb } from "@/lib/ksic-external/validate";
import type { KsicExternalValidation } from "@/lib/ksic-external/types";
import { searchKsic, lookupKsic, listKsicChildren, getKsicDetail, type KsicEntry, type KsicDetailPreview } from "@/lib/survey-ai/ksic";
import {
  generateSurveyWithAi,
  getSurveyAiRuntimeConfig,
  type SurveyAiRuntimeConfig,
} from "@/lib/survey-ai/generate";
import type { SurveyAiBrief, SurveyAiGenerateResult } from "@/lib/survey-ai/types";

export async function searchKsicAction(query: string): Promise<KsicEntry[]> {
  await requireAdminPanelAccess();
  return searchKsic(query);
}

export async function lookupKsicAction(code: string): Promise<KsicEntry | null> {
  await requireAdminPanelAccess();
  return lookupKsic(code);
}

export async function listKsicChildrenAction(
  parentCode: string | null,
): Promise<KsicEntry[]> {
  await requireAdminPanelAccess();
  return listKsicChildren(parentCode);
}

export async function getKsicDetailAction(
  code: string,
): Promise<KsicDetailPreview | null> {
  await requireAdminPanelAccess();
  return getKsicDetail(code);
}

export async function validateKsicExternalAction(
  code: string,
): Promise<KsicExternalValidation> {
  await requireAdminPanelAccess();
  return validateKsicExternalDb(code);
}

export async function generateSurveyAiAction(
  brief: SurveyAiBrief,
): Promise<SurveyAiGenerateResult> {
  await requireAdminPanelAccess();
  return generateSurveyWithAi({
    ksicCode: brief.ksicCode ?? "",
    ksicName: brief.ksicName ?? "",
    researchPurpose: brief.researchPurpose ?? "",
    targetRespondent: brief.targetRespondent ?? "",
    surveyTopic: brief.surveyTopic ?? "",
    additionalNotes: brief.additionalNotes ?? "",
    clarificationAnswers: brief.clarificationAnswers ?? {},
  });
}

export async function getSurveyAiConfigAction(): Promise<
  SurveyAiRuntimeConfig | { error: string }
> {
  await requireAdminPanelAccess();
  return getSurveyAiRuntimeConfig();
}
