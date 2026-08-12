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
  "info_media",
  "contact_fields",
] as const;

/** 리커트 7점 척도 값 (레거시·하위 호환) */
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
  text_single: "주관식 (텍스트)",
  text_multi: "주관식 (다중)",
  likert_7: "리커트 척도",
  dropdown: "드롭다운",
  rank: "순위 선택",
  likert_multi: "척도 (다중)",
  star_rating: "별점 평가",
  info_media: "글/그림/영상",
  contact_fields: "연락처 (항목 입력)",
};

/** 패널·툴팁용 한 줄 설명 */
export const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  mc_single: "보기 중 하나만 선택합니다.",
  mc_multi: "보기 중 여러 개 선택 · 최대 개수를 지정합니다.",
  text_single: "짧은 서술·한 줄 답변을 받습니다.",
  text_multi: "줄마다 주제(라벨)를 두고 각각 텍스트를 입력받습니다.",
  likert_7: "척도 크기(2~10)와 점수별 라벨을 설정합니다. 기본 5점.",
  dropdown: "설정한 선택지를 드롭다운에서 고릅니다.",
  rank: "선택지를 누른 순서대로 1순위, 2순위…를 매깁니다.",
  likert_multi: "여러 항목 각각에 척도(크기·라벨 설정 가능)로 평가합니다.",
  star_rating: "별 5개 중 0.5점 단위로 평가합니다.",
  info_media:
    "페이지 안내·문항 설명용입니다. 응답 입력·문항 번호 없이 설문지에만 표시됩니다.",
  contact_fields: "연락처·이름 등 항목 라벨과 직접 입력을 한 줄씩 받습니다.",
};

export type SurveyInfoMediaType = "image" | "video";

export type DraftQuestion = {
  clientId: string;
  type: QuestionType;
  prompt: string;
  allowSkip: boolean;
  /** 로그인한 직원(employee 이상)에게만 표시 */
  staffOnly: boolean;
  /** 비어 있으면 항상 표시(직원 전용 설정 제외). 하나라도 만족(OR) 시 표시 */
  visibilityRules: QuestionVisibilityCondition[];
  /** 객관식·드롭다운·순위·척도(다중)·연락처 항목 라벨 */
  options: string[];
  /**
   * options와 같은 길이. 기존 DB 보기 id(수정 시 보존). 신규은 null.
   * 설문 저장 시 보기 UUID를 유지해야 기존 응답 코드가 깨지지 않습니다.
   */
  optionIds: (string | null)[];
  /**
   * options와 같은 길이. mc_single·dropdown에서 true면 해당 보기 선택 시 조사 종료.
   * (빈 라벨 보기는 저장 시 함께 제거)
   */
  optionEndsSurvey: boolean[];
  /** 객관식(단일·다중): 기타 보기 사용 여부 */
  otherOptionEnabled: boolean;
  /** 기타 보기 라벨 (기본: 기타) */
  otherOptionLabel: string;
  /** 기타 보기의 DB id (수정 시 보존) */
  otherOptionId: string | null;
  /** mc_multi: 최대 선택 · rank: 순위 개수 */
  maxSelections: number;
  /** 주관식 다중: 답변 줄(입력 칸) 개수, 최소 2 */
  textLineCount: number;
  /** info_media: 안내 본문 */
  infoBody: string;
  /** info_media: 미디어 공개 URL */
  mediaUrl: string | null;
  /** info_media: Storage 경로 */
  mediaPath: string | null;
  /** info_media: image | video */
  mediaType: SurveyInfoMediaType | null;
  /** likert_7·likert_multi: 척도 점수별 라벨 (index 0 = 1점). maxSelections = 척도 크기 */
  likertScaleLabels: string[];
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
    optionIds: [],
    optionEndsSurvey: [],
    otherOptionEnabled: false,
    otherOptionLabel: "기타",
    otherOptionId: null,
    maxSelections: 2,
    textLineCount: 2,
    infoBody: "",
    mediaUrl: null,
    mediaPath: null,
    mediaType: null,
    likertScaleLabels: [],
  };

  if (
    type === "mc_single" ||
    type === "mc_multi" ||
    type === "dropdown" ||
    type === "rank" ||
    type === "likert_multi" ||
    type === "contact_fields" ||
    type === "text_multi"
  ) {
    base.options =
      type === "contact_fields"
        ? ["연락처", "이름", "소속 부서"]
        : type === "text_multi"
          ? ["항목 1", "항목 2"]
          : ["", ""];
    base.optionIds = base.options.map(() => null);
    base.optionEndsSurvey = base.options.map(() => false);
    base.maxSelections = type === "rank" ? 3 : 2;
  }
  if (type === "text_single") {
    base.textLineCount = 1;
  }
  if (type === "text_multi") {
    base.textLineCount = base.options.filter((o) => o.trim()).length || 2;
  }
  if (type === "likert_7") {
    base.maxSelections = 5;
    base.likertScaleLabels = ["", "", "", "", ""];
    base.options = [];
    base.optionIds = [];
    base.optionEndsSurvey = [];
  }
  if (type === "likert_multi") {
    base.maxSelections = 5;
    base.likertScaleLabels = ["", "", "", "", ""];
  }
  if (type === "info_media") {
    base.allowSkip = true;
    base.prompt = "안내";
  }

  return base;
}

/** options 길이에 맞춰 optionEndsSurvey 배열 보정 */
export function syncOptionEndsSurvey(
  options: string[],
  ends: boolean[] | undefined,
): boolean[] {
  return options.map((_, i) => Boolean(ends?.[i]));
}

/** options 길이에 맞춰 optionIds 배열 보정 (부족분은 null) */
export function syncOptionIds(
  options: string[],
  ids: (string | null)[] | undefined,
): (string | null)[] {
  return options.map((_, i) => ids?.[i] ?? null);
}

/** 보기 배열 교체 시 ends·ids를 함께 맞춤 */
export function patchDraftOptions(
  q: DraftQuestion,
  nextOptions: string[],
  extra?: Partial<DraftQuestion>,
): Partial<DraftQuestion> {
  return {
    options: nextOptions,
    optionEndsSurvey: syncOptionEndsSurvey(nextOptions, q.optionEndsSurvey),
    optionIds: syncOptionIds(nextOptions, q.optionIds),
    ...extra,
  };
}

/** 보기 한 줄 삭제(중간 삭제 시 id 대응 유지) */
export function removeDraftOptionAt(
  q: DraftQuestion,
  index: number,
): Partial<DraftQuestion> {
  const options = q.options.filter((_, i) => i !== index);
  const ends = (q.optionEndsSurvey ?? []).filter((_, i) => i !== index);
  const ids = (q.optionIds ?? []).filter((_, i) => i !== index);
  return {
    options,
    optionEndsSurvey: syncOptionEndsSurvey(options, ends),
    optionIds: syncOptionIds(options, ids),
  };
}

/** 보기 한 줄 추가 */
export function appendDraftOption(q: DraftQuestion): Partial<DraftQuestion> {
  return {
    options: [...q.options, ""],
    optionEndsSurvey: [...syncOptionEndsSurvey(q.options, q.optionEndsSurvey), false],
    optionIds: [...syncOptionIds(q.options, q.optionIds), null],
  };
}

/** 라벨에 「조사종료」가 있으면 종료 보기로 제안 */
export function labelSuggestsSurveyEnd(label: string): boolean {
  return /조사\s*종료/.test(label);
}

/** @deprecated likert_7는 likertScaleLabels 사용 */
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

import type { ParticipationFormat } from "@/lib/survey-participation-format";

export type CreateSurveyPayload = {
  title: string;
  participationFormat: ParticipationFormat;
  summary: string;
  /** YYYY-MM-DD */
  periodStart: string;
  /** YYYY-MM-DD */
  periodEnd: string;
  targetCount: number;
  listedPublic: boolean;
  /** 직원 전화 조사용 응답 스크립트·메뉴얼 */
  responseScript: string;
  /** 한국표준산업분류(KSIC) 코드 */
  ksicCode: string;
  /** KSIC 분류명 */
  ksicName: string;
  questions: DraftQuestion[];
};
