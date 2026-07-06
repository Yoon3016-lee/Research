import type { QuestionVisibilityCondition } from "@/lib/survey-visibility";

/** DB `survey_questions.question_type` 과 동일 */
export const QUESTION_TYPES = [
  "mc_single",
  "mc_multi",
  "text_single",
  "text_multi",
  "likert_7",
  "dropdown",
  "rank",
  "likert_multi",
  "star_rating",
] as const;

/** 리커트 7점 척도 값 */
export const LIKERT_7_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;
export type Likert7Value = (typeof LIKERT_7_VALUES)[number];

export function isLikert7Value(value: number): value is Likert7Value {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

/** 별점 0~5 (0.5 단위) */
export function isStarRatingValue(value: number): boolean {
  return value >= 0 && value <= 5 && Math.abs(value * 2 - Math.round(value * 2)) < 0.001;
}

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mc_single: "객관식 (단일 선택)",
  mc_multi: "객관식 (다중 선택)",
  text_single: "주관식 (단일 응답)",
  text_multi: "주관식 (다중 응답)",
  likert_7: "리커트 척도 (1~7)",
  dropdown: "드롭다운",
  rank: "순위 선택",
  likert_multi: "척도 (다중)",
  star_rating: "별점 평가",
};

/** 패널·툴팁용 한 줄 설명 */
export const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  mc_single: "보기 중 하나만 선택합니다.",
  mc_multi: "보기 중 여러 개 선택 · 최대 개수를 지정합니다.",
  text_single: "짧은 서술·한 줄 답변을 받습니다.",
  text_multi: "같은 질문에 여러 입력 칸을 둡니다.",
  likert_7: "1(낮음)부터 7(높음)까지 하나를 고릅니다.",
  dropdown: "설정한 선택지를 드롭다운에서 고릅니다.",
  rank: "선택지를 누른 순서대로 1순위, 2순위…를 매깁니다.",
  likert_multi: "한 문항 안에서 여러 항목 각각 1~7 척도로 평가합니다.",
  star_rating: "별 5개 중 0.5점 단위로 평가합니다.",
};

export type DraftQuestion = {
  clientId: string;
  type: QuestionType;
  prompt: string;
  allowSkip: boolean;
  /** 로그인한 직원(employee 이상)에게만 표시 */
  staffOnly: boolean;
  /** 비어 있으면 항상 표시(직원 전용 설정 제외). 모두 만족(AND) 시 표시 */
  visibilityRules: QuestionVisibilityCondition[];
  /** 객관식·드롭다운·순위·척도(다중) 선택지/항목 */
  options: string[];
  /** mc_multi: 최대 선택 · rank: 순위 개수 */
  maxSelections: number;
  /** 주관식 다중: 답변 줄(입력 칸) 개수, 최소 2 */
  textLineCount: number;
};

export function createDraftQuestion(type: QuestionType): DraftQuestion {
  const clientId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `q-${Date.now()}-${Math.random()}`;

  const base: DraftQuestion = {
    clientId,
    type,
    prompt: "",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [],
    options: [],
    maxSelections: 2,
    textLineCount: 2,
  };

  if (
    type === "mc_single" ||
    type === "mc_multi" ||
    type === "dropdown" ||
    type === "rank" ||
    type === "likert_multi"
  ) {
    base.options = ["", ""];
    base.maxSelections = type === "rank" ? 3 : 2;
  }
  if (type === "text_single") {
    base.textLineCount = 1;
  }
  if (type === "text_multi") {
    base.textLineCount = 2;
  }
  if (type === "likert_7") {
    base.options = ["", ""];
  }

  return base;
}

/** likert_7: options[0]=1점 라벨, options[1]=7점 라벨 (선택) */
export function likertEndpointLabels(options: string[]): {
  minLabel: string | null;
  maxLabel: string | null;
} {
  const min = options[0]?.trim() ?? "";
  const max = options[1]?.trim() ?? "";
  return {
    minLabel: min || null,
    maxLabel: max || null,
  };
}

export type CreateSurveyPayload = {
  title: string;
  summary: string;
  /** YYYY-MM-DD */
  periodStart: string;
  /** YYYY-MM-DD */
  periodEnd: string;
  targetCount: number;
  listedPublic: boolean;
  /** 직원 전화 조사용 응답 스크립트·메뉴얼 */
  responseScript: string;
  questions: DraftQuestion[];
};
