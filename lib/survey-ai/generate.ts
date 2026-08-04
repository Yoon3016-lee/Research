import "server-only";

import { buildSurveyAiSystemPrompt, buildSurveyAiUserPrompt } from "@/lib/survey-ai/prompts";
import { formatKsicContext } from "@/lib/survey-ai/ksic";
import { validateKsicExternalDb } from "@/lib/ksic-external/validate";
import {
  completeSurveyAiJson,
  getSurveyAiProviderLabel,
  resolveSurveyAiLlm,
} from "@/lib/survey-ai/llm";
import { normalizeAiProposal, parseAiResponseJson } from "@/lib/survey-ai/parse";
import type {
  SurveyAiBrief,
  SurveyAiClarification,
  SurveyAiGenerateResult,
  SurveyAiRawProposal,
} from "@/lib/survey-ai/types";

function getProposalCount(): number {
  const raw = process.env.SURVEY_AI_PROPOSAL_COUNT?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 3;
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(n, 3);
}

function isClarificationArray(value: unknown): value is SurveyAiClarification[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (c) =>
      c &&
      typeof c === "object" &&
      typeof (c as SurveyAiClarification).id === "string" &&
      typeof (c as SurveyAiClarification).question === "string" &&
      typeof (c as SurveyAiClarification).reason === "string",
  );
}

function parseSurveyAiResponse(content: string): SurveyAiGenerateResult {
  const parsed = parseAiResponseJson(content) as Record<string, unknown>;

  if (parsed.status === "needs_clarification") {
    const clarifications = parsed.clarifications;
    if (!isClarificationArray(clarifications) || clarifications.length === 0) {
      return {
        status: "error",
        error: "AI가 보완 요청 형식을 올바르게 반환하지 않았습니다.",
      };
    }
    return {
      status: "needs_clarification",
      clarifications: clarifications.map((c) => ({
        id: c.id,
        question: c.question,
        reason: c.reason,
        suggestions: Array.isArray(c.suggestions)
          ? c.suggestions.filter((s) => typeof s === "string")
          : [],
      })),
    };
  }

  if (parsed.status !== "proposals" || !Array.isArray(parsed.proposals)) {
    return { status: "error", error: "AI 응답 형식이 올바르지 않습니다." };
  }

  const proposals = [];
  const skipped: string[] = [];
  for (const raw of parsed.proposals as SurveyAiRawProposal[]) {
    const normalized = normalizeAiProposal(raw);
    if (typeof normalized === "string") {
      skipped.push(normalized);
      continue;
    }
    proposals.push(normalized);
  }

  if (proposals.length === 0) {
    return {
      status: "error",
      error:
        skipped.length > 0
          ? skipped.join("\n\n")
          : "생성된 설문안이 없습니다.",
    };
  }

  return {
    status: "proposals",
    proposals,
    warnings: skipped.length > 0 ? skipped : undefined,
  };
}

export async function generateSurveyWithAi(brief: SurveyAiBrief): Promise<SurveyAiGenerateResult> {
  const llm = resolveSurveyAiLlm();
  if ("error" in llm) {
    return { status: "error", error: llm.error };
  }

  if (!brief.ksicCode.trim()) {
    return { status: "error", error: "KSIC 코드를 입력하세요." };
  }
  if (!brief.researchPurpose.trim()) {
    return { status: "error", error: "조사 목적을 입력하세요." };
  }

  const proposalCount = getProposalCount();

  try {
    const externalValidation = await validateKsicExternalDb(brief.ksicCode);
    const preWarnings: string[] = [];

    if (externalValidation.status === "missing_in_local") {
      return { status: "error", error: externalValidation.message };
    }
    if (
      externalValidation.status === "missing_in_external" ||
      externalValidation.status === "name_mismatch" ||
      externalValidation.status === "no_snapshot"
    ) {
      preWarnings.push(externalValidation.message);
    }

    const ksicBlock = await formatKsicContext(brief.ksicCode, brief.ksicName);
    const systemPrompt = buildSurveyAiSystemPrompt(proposalCount);
    const userPrompt = buildSurveyAiUserPrompt(brief, ksicBlock);

    const content = await completeSurveyAiJson({
      config: llm,
      systemPrompt,
      userPrompt,
    });

    const result = parseSurveyAiResponse(content);
    if (result.status === "proposals" && preWarnings.length > 0) {
      return {
        ...result,
        warnings: [...preWarnings, ...(result.warnings ?? [])],
      };
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 호출 중 오류가 발생했습니다.";
    return { status: "error", error: message };
  }
}

export type SurveyAiRuntimeConfig = {
  proposalCount: number;
  provider: string;
  model: string;
  providerLabel: string;
};

export function getSurveyAiRuntimeConfig(): SurveyAiRuntimeConfig | { error: string } {
  const llm = resolveSurveyAiLlm();
  if ("error" in llm) {
    return { error: llm.error };
  }
  return {
    proposalCount: getProposalCount(),
    provider: llm.provider,
    model: llm.model,
    providerLabel: getSurveyAiProviderLabel(llm),
  };
}
