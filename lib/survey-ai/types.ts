import type { CreateSurveyPayload, DraftQuestion } from "@/lib/survey-types";

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

/** 생성된 설문안의 보완·개선 제안 */
export type SurveyAiImprovementNote = {
  area: string;
  detail: string;
};

/** 재생성 시 참고할 이전 설문안 요약 */
export type SurveyAiPreviousProposalSummary = {
  title: string;
  summary: string;
  improvements: SurveyAiImprovementNote[];
};

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
  /**
   * 설문안 제시 후 관리자가 입력한 추가 목적·보완 요청.
   * 있으면 보완 질문 없이 새 proposals를 생성하도록 유도합니다.
   */
  revisionFeedback: string;
  /** 직전 라운드에서 생성된 설문안 요약(재생성 시 참고) */
  previousProposals: SurveyAiPreviousProposalSummary[];
};

/** 추가로 만들면 좋은 문항 방향 */
export type SurveyAiAdditionalQuestionIdea = {
  direction: string;
  reason: string;
  suggestedType: string | null;
  examplePrompt: string | null;
};

/** AI 원시 문항 (clientId 없음) */
export type SurveyAiRawQuestion = {
  type: string;
  prompt: string;
  allowSkip?: boolean;
  staffOnly?: boolean;
  options?: string[];
  /** mc_single·dropdown: options와 같은 길이, true면 조사 종료 */
  optionEndsSurvey?: boolean[];
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
  improvements?: { area?: string; detail?: string }[];
  additionalQuestions?: {
    direction?: string;
    reason?: string;
    suggestedType?: string;
    examplePrompt?: string;
  }[];
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
  improvements: SurveyAiImprovementNote[];
  additionalQuestions: SurveyAiAdditionalQuestionIdea[];
};

export type SurveyAiGenerateResult =
  | { status: "needs_clarification"; clarifications: SurveyAiClarification[] }
  | { status: "proposals"; proposals: SurveyAiProposal[]; warnings?: string[] }
  | { status: "error"; error: string };

/** 설문 빌더로 넘길 때 sessionStorage에 저장 */
export type SurveyAiDraftPayload = CreateSurveyPayload & {
  aiSource: {
    proposalId: string;
    rationale: string;
    ksicRelevance: string;
    improvements: SurveyAiImprovementNote[];
    additionalQuestions: SurveyAiAdditionalQuestionIdea[];
  };
};

export const SURVEY_AI_DRAFT_STORAGE_KEY = "research-a:survey-ai-draft";
