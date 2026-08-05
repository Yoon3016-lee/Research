import "server-only";

import {
  completeSurveyAiText,
  resolveSurveyAiLlm,
} from "@/lib/survey-ai/llm";
import { formatKsicContext } from "@/lib/survey-ai/ksic";

const AXI_SYSTEM_PROMPT = `당신은 AXI입니다. 전화·설문 조사 직원을 돕는 짧은 가이드 AI입니다.

역할:
- 단어·용어의 뜻 설명
- 설문 보기(선택지) 해석
- 스크립트에 나온 표현의 의미 안내
- 설문의 KSIC(한국표준산업분류) 코드·업종 특성을 반영한 해석

규칙 (필수):
- 한국어로만 답변
- 반드시 완전한 1~2문장만 출력 (의미 전달에 필요한 길이, 대략 40~120자)
- 답을 중간에 끊지 말 것. 한 단어만 출력 금지
- 목록·번호·불릿·마크다운·서론·맺음말 금지
- KSIC·업종 정보가 있으면 그 산업 맥락에 맞게 설명 (일반론만 나열하지 말 것)
- 설문 설계·법무·의료·개인정보 처리 요청은 "해당 문의는 AXI 안내 범위를 벗어납니다." 한 문장으로만 답함
- 모르는 내용은 추측하지 말고 짧게 모른다고 안내`;

const MAX_QUESTION_LEN = 400;
const MAX_CONTEXT_LEN = 2500;

function clip(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n…(이하 생략)`;
}

/** 줄·문장 단위로 정리하되, 잘린 한 단어 답은 거부할 수 있게 유지 */
function normalizeAxiAnswer(raw: string): string {
  let text = raw
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_`#]+/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 문장 종결(다/요/다./요. 등) 기준으로 최대 2문장
  const sentences = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g);
  if (sentences && sentences.length > 0) {
    text = sentences
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
  }

  if (text.length > 200) {
    // 문장 중간 절단보다 끝 문장 단위 우선
    const cut = text.slice(0, 197);
    const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"), cut.lastIndexOf("다 "), cut.lastIndexOf("요 "));
    text = lastStop > 40 ? cut.slice(0, lastStop + 1).trim() : `${cut}…`;
  }
  return text;
}

function looksTruncatedOrTooShort(answer: string): boolean {
  const t = answer.trim();
  if (t.length < 12) return true;
  // 조사·서술어 없이 명사만 짧은 경우
  if (t.length < 24 && !/[다요음임까네]$/.test(t) && !/[.!?…]/.test(t)) {
    return true;
  }
  return false;
}

export type AxiAskResult =
  | { ok: true; answer: string }
  | { ok: false; error: string };

export async function askAxiGuide(params: {
  question: string;
  surveyTitle: string;
  scriptContext: string;
  ksicCode?: string;
  ksicName?: string;
}): Promise<AxiAskResult> {
  const question = params.question.trim();
  if (!question) {
    return { ok: false, error: "질문을 입력해 주세요." };
  }
  if (question.length > MAX_QUESTION_LEN) {
    return { ok: false, error: `질문은 ${MAX_QUESTION_LEN}자 이내로 입력해 주세요.` };
  }

  const llm = resolveSurveyAiLlm();
  if ("error" in llm) {
    return { ok: false, error: llm.error };
  }

  const ksicCode = (params.ksicCode ?? "").trim();
  const ksicName = (params.ksicName ?? "").trim();

  let ksicBlock = "";
  if (ksicCode || ksicName) {
    try {
      if (ksicCode) {
        ksicBlock = await formatKsicContext(ksicCode, ksicName);
      } else {
        ksicBlock = `업종명: ${ksicName}`;
      }
    } catch {
      ksicBlock = [
        ksicCode ? `KSIC 코드: ${ksicCode}` : "",
        ksicName ? `업종명: ${ksicName}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const userPrompt = [
    `설문 제목: ${params.surveyTitle.trim() || "(없음)"}`,
    "",
    "## 설문 KSIC·업종 (답변 시 우선 참고)",
    ksicBlock || "(이 설문에 KSIC가 등록되지 않음)",
    "",
    "## 참고 스크립트·문항 (일부, 질문과 관련될 때만 활용)",
    clip(params.scriptContext, MAX_CONTEXT_LEN) || "(스크립트 없음)",
    "",
    "## 직원 질문",
    question,
    "",
    ksicBlock
      ? "KSIC·업종 맥락을 반영해 완전한 문장 1~2개로만 답하세요. 한 단어만 쓰지 마세요."
      : "완전한 문장 1~2개로만 답하세요. 한 단어만 쓰지 마세요.",
  ].join("\n");

  try {
    const raw = await completeSurveyAiText({
      config: llm,
      systemPrompt: AXI_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3,
      // Gemini 2.5 thinking이 예산을 잡아먹어 답이 잘리지 않도록 여유 확보
      maxTokens: 1024,
      thinkingBudget: 0,
    });
    const answer = normalizeAxiAnswer(raw);
    if (!answer) {
      return { ok: false, error: "AXI 응답이 비어 있습니다. 다시 시도해 주세요." };
    }
    if (looksTruncatedOrTooShort(answer)) {
      return {
        ok: false,
        error: "AXI 응답이 불완전합니다. 질문을 다시 보내 주세요.",
      };
    }
    return { ok: true, answer };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AXI 호출 중 오류가 발생했습니다.";
    // thinkingConfig 미지원 모델이면 thinkingBudget 없이 재시도
    if (
      typeof message === "string" &&
      /thinking|Unknown name|invalid/i.test(message)
    ) {
      try {
        const raw = await completeSurveyAiText({
          config: llm,
          systemPrompt: AXI_SYSTEM_PROMPT,
          userPrompt,
          temperature: 0.3,
          maxTokens: 1024,
        });
        const answer = normalizeAxiAnswer(raw);
        if (!answer || looksTruncatedOrTooShort(answer)) {
          return {
            ok: false,
            error: "AXI 응답이 불완전합니다. 질문을 다시 보내 주세요.",
          };
        }
        return { ok: true, answer };
      } catch (retryErr) {
        const retryMessage =
          retryErr instanceof Error ? retryErr.message : "AXI 호출 중 오류가 발생했습니다.";
        return { ok: false, error: retryMessage };
      }
    }
    return { ok: false, error: message };
  }
}
