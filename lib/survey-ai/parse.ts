import "server-only";

import { validateQuestion } from "@/lib/survey-persist";
import {
  createDraftQuestion,
  QUESTION_TYPES,
  type DraftQuestion,
  type QuestionType,
} from "@/lib/survey-types";
import type {
  SurveyAiProposal,
  SurveyAiQuestionScript,
  SurveyAiRawProposal,
  SurveyAiRawQuestion,
} from "@/lib/survey-ai/types";

function isQuestionType(value: string): value is QuestionType {
  return (QUESTION_TYPES as readonly string[]).includes(value);
}

function normalizeRawQuestion(raw: SurveyAiRawQuestion, index: number): DraftQuestion | string {
  if (!isQuestionType(raw.type)) {
    return `문항 ${index + 1}: 지원하지 않는 유형 "${raw.type}"`;
  }

  const q = createDraftQuestion(raw.type);
  q.prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : "";
  q.allowSkip = Boolean(raw.allowSkip);
  q.staffOnly = Boolean(raw.staffOnly);

  if (Array.isArray(raw.options)) {
    q.options = raw.options.map((o) => (typeof o === "string" ? o : String(o)));
  }

  if (typeof raw.maxSelections === "number" && Number.isFinite(raw.maxSelections)) {
    q.maxSelections = Math.max(1, Math.floor(raw.maxSelections));
  }

  if (typeof raw.textLineCount === "number" && Number.isFinite(raw.textLineCount)) {
    q.textLineCount = Math.max(raw.type === "text_multi" ? 2 : 1, Math.floor(raw.textLineCount));
  }

  if (Array.isArray(raw.visibilityRules)) {
    q.visibilityRules = raw.visibilityRules
      .filter(
        (r) =>
          r &&
          typeof r.sourceOrderIndex === "number" &&
          typeof r.optionIndex === "number" &&
          Number.isInteger(r.sourceOrderIndex) &&
          Number.isInteger(r.optionIndex),
      )
      .map((r) => ({
        sourceOrderIndex: r.sourceOrderIndex,
        optionIndex: r.optionIndex,
      }));
  }

  return q;
}

export function formatCatiResponseScript(
  questions: DraftQuestion[],
  questionScripts: SurveyAiQuestionScript[],
  openingScript?: string,
  closingScript?: string,
): string {
  const parts: string[] = [];

  if (openingScript?.trim()) {
    parts.push("【조사 시작 멘트】", openingScript.trim(), "");
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const script = questionScripts.find((s) => s.orderIndex === i);
    const block: string[] = [`【문항 ${i + 1}】 ${q.prompt.trim()}`];

    if (script?.interviewerScript?.trim()) {
      block.push(`▶ 조사원 멘트: ${script.interviewerScript.trim()}`);
    }
    if (script?.cautions?.length) {
      for (const c of script.cautions) {
        if (c.trim()) block.push(`⚠ 주의: ${c.trim()}`);
      }
    }
    if (q.allowSkip) block.push("※ 무응답 허용 문항");
    if (q.staffOnly) block.push("※ 직원 전용 문항 (게스트 비표시)");

    parts.push(block.join("\n"), "");
  }

  if (closingScript?.trim()) {
    parts.push("【조사 종료 멘트】", closingScript.trim());
  }

  return parts.join("\n").trim();
}

export function normalizeAiProposal(raw: SurveyAiRawProposal): SurveyAiProposal | string {
  if (!raw.title?.trim()) return "제안 설문에 제목이 없습니다.";
  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    return "제안 설문에 문항이 없습니다.";
  }

  const questions: DraftQuestion[] = [];
  for (let i = 0; i < raw.questions.length; i++) {
    const normalized = normalizeRawQuestion(raw.questions[i], i);
    if (typeof normalized === "string") return normalized;
    questions.push(normalized);
  }

  for (let i = 0; i < questions.length; i++) {
    const err = validateQuestion(questions[i], i, questions);
    if (err) return `제안 "${raw.title}": ${err}`;
  }

  const questionScripts: SurveyAiQuestionScript[] = Array.isArray(raw.questionScripts)
    ? raw.questionScripts
        .filter(
          (s) =>
            s &&
            typeof s.orderIndex === "number" &&
            Number.isInteger(s.orderIndex) &&
            s.orderIndex >= 0 &&
            s.orderIndex < questions.length,
        )
        .map((s) => ({
          orderIndex: s.orderIndex,
          interviewerScript:
            typeof s.interviewerScript === "string" ? s.interviewerScript.trim() : "",
          cautions: Array.isArray(s.cautions)
            ? s.cautions.filter((c) => typeof c === "string" && c.trim()).map((c) => c.trim())
            : [],
        }))
    : [];

  const responseScript =
    formatCatiResponseScript(
      questions,
      questionScripts,
      raw.openingScript,
      raw.closingScript,
    ) || "(스크립트 없음)";

  return {
    id: raw.id?.trim() || `proposal-${questions.length}`,
    title: raw.title.trim(),
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    rationale: typeof raw.rationale === "string" ? raw.rationale.trim() : "",
    ksicRelevance: typeof raw.ksicRelevance === "string" ? raw.ksicRelevance.trim() : "",
    questions,
    responseScript,
    questionScripts,
  };
}

export function parseAiResponseJson(text: string): unknown {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 응답에서 JSON을 찾을 수 없습니다.");
  return JSON.parse(jsonMatch[0]);
}
