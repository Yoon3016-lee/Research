"use server";

import { validateKsicExternalDb } from "@/lib/ksic-external/validate";
import type { KsicExternalValidation } from "@/lib/ksic-external/types";
import { searchKsic, lookupKsic, listKsicChildren, getKsicDetail, type KsicEntry, type KsicDetailPreview } from "@/lib/survey-ai/ksic";
import {
  generateSurveyWithAi,
  getSurveyAiRuntimeConfig,
  type SurveyAiRuntimeConfig,
} from "@/lib/survey-ai/generate";
import {
  recommendKsicFromUnstructured,
} from "@/lib/survey-ai/ksic-recommend";
import type { KsicRecommendResult } from "@/lib/survey-ai/ksic-recommend-types";
import {
  assertKsicRecommendAccess,
  consumeKsicRecommendPublicUse,
  getKsicRecommendPublicUsageForCurrentUser,
} from "@/lib/survey-ai/ksic-recommend-usage";
import type { SurveyAiAccess } from "@/lib/survey-ai/access";
import { assertSurveyAiAccess } from "@/lib/survey-ai/access";
import type { SurveyAiBrief, SurveyAiGenerateResult } from "@/lib/survey-ai/types";

export async function searchKsicAction(
  query: string,
  access: SurveyAiAccess = "admin",
): Promise<KsicEntry[]> {
  await assertSurveyAiAccess(access);
  return searchKsic(query);
}

export async function lookupKsicAction(
  code: string,
  access: SurveyAiAccess = "admin",
): Promise<KsicEntry | null> {
  await assertSurveyAiAccess(access);
  return lookupKsic(code);
}

export async function listKsicChildrenAction(
  parentCode: string | null,
  access: SurveyAiAccess = "admin",
): Promise<KsicEntry[]> {
  await assertSurveyAiAccess(access);
  return listKsicChildren(parentCode);
}

export async function getKsicDetailAction(
  code: string,
  access: SurveyAiAccess = "admin",
): Promise<KsicDetailPreview | null> {
  await assertSurveyAiAccess(access);
  return getKsicDetail(code);
}

export async function validateKsicExternalAction(
  code: string,
  access: SurveyAiAccess = "admin",
): Promise<KsicExternalValidation> {
  await assertSurveyAiAccess(access);
  return validateKsicExternalDb(code);
}

/**
 * 비정형 설명 → LLM 검색어 → KSIC DB 검증 후보
 * @param channel admin = 관리자 무제한 / public = 로그인·비로그인 체험(횟수 제한) / demo = 발표·체험(무제한)
 */
export async function recommendKsicFromUnstructuredAction(
  text: string,
  channel: "admin" | "public" | "demo" = "admin",
): Promise<KsicRecommendResult> {
  const access = await assertKsicRecommendAccess(channel);
  if (!access.ok) {
    if (access.status === "limit_exceeded" && access.usage) {
      return {
        status: "limit_exceeded",
        message: access.message,
        usage: access.usage,
      };
    }
    return { status: "unauthorized", message: access.message };
  }

  const result = await recommendKsicFromUnstructured(
    typeof text === "string" ? text : "",
  );

  // 공개 체험: 추론이 실제로 수행된 경우(성공·후보없음)에만 횟수 차감
  if (channel === "public" && (result.status === "ok" || result.status === "empty")) {
    try {
      const usage = await consumeKsicRecommendPublicUse(access.subject);
      return { ...result, usage };
    } catch (err) {
      return {
        status: "error",
        error:
          err instanceof Error ? err.message : "체험 횟수 저장에 실패했습니다.",
        usage: access.usage,
      };
    }
  }

  return result;
}

/** 공개 홈 체험 잔여 횟수 조회 (비로그인 포함) */
export async function getKsicRecommendTrialStatusAction(): Promise<{
  status: "ok";
  identity: "user" | "visitor";
  usage: { used: number; limit: number; remaining: number };
}> {
  return getKsicRecommendPublicUsageForCurrentUser();
}

export async function generateSurveyAiAction(
  brief: SurveyAiBrief,
  access: SurveyAiAccess = "admin",
): Promise<SurveyAiGenerateResult> {
  await assertSurveyAiAccess(access);
  return generateSurveyWithAi({
    ksicCode: brief.ksicCode ?? "",
    ksicName: brief.ksicName ?? "",
    researchPurpose: brief.researchPurpose ?? "",
    targetRespondent: brief.targetRespondent ?? "",
    surveyTopic: brief.surveyTopic ?? "",
    additionalNotes: brief.additionalNotes ?? "",
    clarificationAnswers: brief.clarificationAnswers ?? {},
    revisionFeedback: brief.revisionFeedback ?? "",
    previousProposals: Array.isArray(brief.previousProposals)
      ? brief.previousProposals
      : [],
  });
}

export async function getSurveyAiConfigAction(
  access: SurveyAiAccess = "admin",
): Promise<SurveyAiRuntimeConfig | { error: string }> {
  await assertSurveyAiAccess(access);
  return getSurveyAiRuntimeConfig();
}
