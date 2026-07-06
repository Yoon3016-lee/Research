import "server-only";

import OpenAI from "openai";
import { buildSurveyAiSystemPrompt, buildSurveyAiUserPrompt } from "@/lib/survey-ai/prompts";
import { normalizeAiProposal, parseAiResponseJson } from "@/lib/survey-ai/parse";
import type {
  SurveyAiBrief,
  SurveyAiClarification,
  SurveyAiGenerateResult,
  SurveyAiRawProposal,
} from "@/lib/survey-ai/types";

function getProposalCount(): number {
  const raw = process.env.SURVEY_AI_PROPOSAL_COUNT?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 2;
  if (!Number.isFinite(n) || n < 1) return 2;
  return Math.min(n, 3);
}

function getOpenAiClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
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

export async function generateSurveyWithAi(brief: SurveyAiBrief): Promise<SurveyAiGenerateResult> {
  const client = getOpenAiClient();
  if (!client) {
    return {
      status: "error",
      error:
        "OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 키를 추가한 뒤 서버를 재시작하세요.",
    };
  }

  if (!brief.ksicCode.trim()) {
    return { status: "error", error: "KSIC 코드를 입력하세요." };
  }
  if (!brief.researchPurpose.trim()) {
    return { status: "error", error: "조사 목적을 입력하세요." };
  }

  const proposalCount = getProposalCount();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSurveyAiSystemPrompt(proposalCount) },
        { role: "user", content: buildSurveyAiUserPrompt(brief) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { status: "error", error: "AI 응답이 비어 있습니다." };
    }

    const parsed = parseAiResponseJson(content) as Record<string, unknown>;

    if (parsed.status === "needs_clarification") {
      const clarifications = parsed.clarifications;
      if (!isClarificationArray(clarifications) || clarifications.length === 0) {
        return {
          status: "error",
          error: "AI가 보완 질문 형식을 올바르게 반환하지 않았습니다.",
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
    for (const raw of parsed.proposals as SurveyAiRawProposal[]) {
      const normalized = normalizeAiProposal(raw);
      if (typeof normalized === "string") {
        return { status: "error", error: normalized };
      }
      proposals.push(normalized);
    }

    if (proposals.length === 0) {
      return { status: "error", error: "생성된 설문안이 없습니다." };
    }

    return { status: "proposals", proposals };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 호출 중 오류가 발생했습니다.";
    return { status: "error", error: message };
  }
}

export function getSurveyAiProposalCount(): number {
  return getProposalCount();
}
