import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type SurveyAiProvider = "openai" | "gemini";

export type SurveyAiLlmConfig = {
  provider: SurveyAiProvider;
  model: string;
};

/** Next.js가 빌드 시 process.env.KEY를 비워 인라인하는 것을 피하기 위해 동적 접근 */
function readServerEnv(key: string): string | undefined {
  const value = process.env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readProviderPreference(): SurveyAiProvider | "auto" {
  const raw = readServerEnv("SURVEY_AI_PROVIDER")?.toLowerCase();
  if (raw === "openai" || raw === "gemini") return raw;
  return "auto";
}

function getGeminiApiKey(): string | null {
  return readServerEnv("GEMINI_API_KEY") ?? readServerEnv("GOOGLE_API_KEY") ?? null;
}

function missingKeyHint(): string {
  const hasGemini = Boolean(getGeminiApiKey());
  const hasOpenai = Boolean(readServerEnv("OPENAI_API_KEY"));
  const lines = [
    `GEMINI_API_KEY: ${hasGemini ? "설정됨" : "없음"}`,
    `OPENAI_API_KEY: ${hasOpenai ? "설정됨" : "없음"}`,
    "",
    ".env.local 저장 후 개발 서버를 완전히 종료했다가 다시 시작하세요.",
    "  npm run dev:clean",
  ];
  return lines.join("\n");
}

export function resolveSurveyAiLlm(): SurveyAiLlmConfig | { error: string } {
  const pref = readProviderPreference();
  const openaiKey = readServerEnv("OPENAI_API_KEY");
  const geminiKey = getGeminiApiKey();

  if (pref === "openai") {
    if (!openaiKey) {
      return {
        error:
          "SURVEY_AI_PROVIDER=openai 이지만 OPENAI_API_KEY가 없습니다.\n\n" + missingKeyHint(),
      };
    }
    return {
      provider: "openai",
      model: readServerEnv("OPENAI_MODEL") ?? "gpt-4o-mini",
    };
  }

  if (pref === "gemini") {
    if (!geminiKey) {
      return {
        error:
          "SURVEY_AI_PROVIDER=gemini 이지만 GEMINI_API_KEY(또는 GOOGLE_API_KEY)가 없습니다.\n\n" +
          missingKeyHint(),
      };
    }
    return {
      provider: "gemini",
      model: readServerEnv("GEMINI_MODEL") ?? "gemini-2.5-flash",
    };
  }

  if (openaiKey) {
    return {
      provider: "openai",
      model: readServerEnv("OPENAI_MODEL") ?? "gpt-4o-mini",
    };
  }

  if (geminiKey) {
    return {
      provider: "gemini",
      model: readServerEnv("GEMINI_MODEL") ?? "gemini-2.5-flash",
    };
  }

  return {
    error: "AI API 키가 없습니다.\n\n" + missingKeyHint(),
  };
}

export function getSurveyAiProviderLabel(config: SurveyAiLlmConfig): string {
  if (config.provider === "gemini") return `Gemini (${config.model})`;
  return `OpenAI (${config.model})`;
}

async function completeWithOpenAi(
  config: SurveyAiLlmConfig,
  systemPrompt: string,
  userPrompt: string,
  options?: { json?: boolean; temperature?: number; maxTokens?: number },
): Promise<string> {
  const key = readServerEnv("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");

  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: config.model,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens,
    response_format: options?.json === false ? undefined : { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("AI 응답이 비어 있습니다.");
  }
  return content;
}

async function completeWithGemini(
  config: SurveyAiLlmConfig,
  systemPrompt: string,
  userPrompt: string,
  options?: {
    json?: boolean;
    temperature?: number;
    maxTokens?: number;
    /** Gemini 2.5 thinking 예산. 0이면 사고 생략(짧은 답변에 권장) */
    thinkingBudget?: number;
  },
): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY(또는 GOOGLE_API_KEY)가 설정되지 않았습니다.");
  }

  const genAI = new GoogleGenerativeAI(key);
  const generationConfig: Record<string, unknown> = {
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxTokens,
    responseMimeType: options?.json === false ? "text/plain" : "application/json",
  };
  if (typeof options?.thinkingBudget === "number") {
    generationConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget };
  }

  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: systemPrompt,
    generationConfig: generationConfig as Parameters<
      GoogleGenerativeAI["getGenerativeModel"]
    >[0]["generationConfig"],
  });

  const result = await model.generateContent(userPrompt);
  const content = result.response.text();
  if (!content?.trim()) {
    throw new Error("AI 응답이 비어 있습니다.");
  }
  return content;
}

export async function completeSurveyAiJson(params: {
  config: SurveyAiLlmConfig;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const { config, systemPrompt, userPrompt } = params;
  if (config.provider === "gemini") {
    return completeWithGemini(config, systemPrompt, userPrompt);
  }
  return completeWithOpenAi(config, systemPrompt, userPrompt);
}

/** AXI 등 짧은 평문 답변용 */
export async function completeSurveyAiText(params: {
  config: SurveyAiLlmConfig;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  /** Gemini 전용. 짧은 가이드 답변은 0 권장 */
  thinkingBudget?: number;
}): Promise<string> {
  const {
    config,
    systemPrompt,
    userPrompt,
    temperature = 0.3,
    maxTokens = 1024,
    thinkingBudget,
  } = params;
  const options = {
    json: false as const,
    temperature,
    maxTokens,
    thinkingBudget,
  };
  if (config.provider === "gemini") {
    return completeWithGemini(config, systemPrompt, userPrompt, options);
  }
  return completeWithOpenAi(config, systemPrompt, userPrompt, options);
}
