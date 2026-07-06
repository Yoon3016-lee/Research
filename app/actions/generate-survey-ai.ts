"use server";

import { requireAdminPanelAccess } from "@/lib/require-admin";
import { searchKsic, lookupKsic, type KsicEntry } from "@/lib/survey-ai/ksic";
import {
  generateSurveyWithAi,
  getSurveyAiProposalCount,
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

export async function getSurveyAiConfigAction(): Promise<{ proposalCount: number }> {
  await requireAdminPanelAccess();
  return { proposalCount: getSurveyAiProposalCount() };
}
