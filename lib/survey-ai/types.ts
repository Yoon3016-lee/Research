import type { CreateSurveyPayload, DraftQuestion } from "@/lib/survey-types";

/** 관리자가 AI에 전달하는 조사 개요 */
export type SurveyAiBrief = {
  ksicCode: string;
  ksicName: string;
  researchPurpose: string;
  targetRespondent: string;
  surveyTopic: string;
  additionalNotes: string;
  /** 이전 단계에서 AI가 요청한 보완 답변 */
  clarificationAnswers: Record<string, string>;
};

export type SurveyAiClarification = {
  id: string;
  question: string;
  reason: string;
  suggestions: string[];
};

export type SurveyAiQuestionScript = {
  orderIndex: number;
  interviewerScript: string;
  cautions: string[];
};

/** AI 원시 문항 (clientId 없음) */
export type SurveyAiRawQuestion = {
  type: string;
  prompt: string;
  allowSkip?: boolean;
  staffOnly?: boolean;
  options?: string[];
  maxSelections?: number;
  textLineCount?: number;
  visibilityRules?: { sourceOrderIndex: number; optionIndex: number }[];
};

export type SurveyAiRawProposal = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  ksicRelevance: string;
  questions: SurveyAiRawQuestion[];
  questionScripts: SurveyAiQuestionScript[];
  openingScript?: string;
  closingScript?: string;
};

export type SurveyAiProposal = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  ksicRelevance: string;
  questions: DraftQuestion[];
  responseScript: string;
  questionScripts: SurveyAiQuestionScript[];
};

export type SurveyAiGenerateResult =
  | { status: "needs_clarification"; clarifications: SurveyAiClarification[] }
  | { status: "proposals"; proposals: SurveyAiProposal[] }
  | { status: "error"; error: string };

/** 설문 빌더로 넘길 때 sessionStorage에 저장 */
export type SurveyAiDraftPayload = CreateSurveyPayload & {
  aiSource: {
    proposalId: string;
    rationale: string;
    ksicRelevance: string;
  };
};

export const SURVEY_AI_DRAFT_STORAGE_KEY = "research-a:survey-ai-draft";
