import {
  QUESTION_TYPES,
  QUESTION_TYPE_DESCRIPTIONS,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/survey-types";
import { SURVEY_BRANCHING_SOURCE_RULE } from "@/lib/survey-visibility";

/** AI 프롬프트에 삽입 — 문항 유형이 추가·변경되면 자동 반영 */
export function buildQuestionTypeSpecForAi(): string {
  const lines = QUESTION_TYPES.map((type) => {
    const label = QUESTION_TYPE_LABELS[type];
    const desc = QUESTION_TYPE_DESCRIPTIONS[type];
    const fields = describeFieldsForType(type);
    return `- type: "${type}" (${label}) — ${desc}\n  필드: ${fields}`;
  });

  return [
    "사용 가능한 question.type 값 (이 목록에 없는 type은 사용 금지):",
    ...lines,
    "",
    "공통 필드:",
    "- prompt (string, 필수): 질문 문구",
    "- allowSkip (boolean, 기본 false): 무응답 허용",
    "- staffOnly (boolean, 기본 false): 직원 전용 문항",
    `- visibilityRules (선택): [{ sourceOrderIndex: number, optionIndex: number }] — ${SURVEY_BRANCHING_SOURCE_RULE}`,
  ].join("\n");
}

function describeFieldsForType(type: QuestionType): string {
  switch (type) {
    case "mc_single":
    case "mc_multi":
    case "dropdown":
      return "options (string[], 2개 이상), mc_multi는 maxSelections (1~선택지 수)";
    case "rank":
      return "options (string[], 2개 이상), maxSelections = 순위 개수 (1~선택지 수)";
    case "text_single":
      return "options 불필요";
    case "text_multi":
      return "textLineCount (number, 최소 2)";
    case "likert_7":
      return "options [0]=1점 라벨, [1]=7점 라벨 (선택, 빈 문자열 가능)";
    case "likert_multi":
      return "options = 평가 항목 (string[], 2개 이상)";
    case "star_rating":
      return "options 불필요 (0~5점 별점)";
    default:
      return "";
  }
}

export function getAllowedQuestionTypes(): readonly string[] {
  return QUESTION_TYPES;
}
