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
    "- optionEndsSurvey (선택, mc_single·dropdown만): boolean[] — options와 같은 길이. true면 해당 보기 선택 시 조사 종료(이후 문항 숨김). 스크리닝 「아니오」 등에 사용. 후속 문항마다 visibilityRules를 걸 필요 없음.",
  ].join("\n");
}

function describeFieldsForType(type: QuestionType): string {
  switch (type) {
    case "mc_single":
    case "dropdown":
      return "options (string[], 2개 이상), optionEndsSurvey (boolean[], 선택 — 조사 종료 보기)";
    case "mc_multi":
      return "options (string[], 2개 이상), maxSelections (1~선택지 수)";
    case "rank":
      return "options (string[], 2개 이상), maxSelections = 순위 개수 (1~선택지 수)";
    case "text_single":
      return "options 불필요";
    case "text_multi":
      return "options = 항목 주제 라벨 (string[], 1개 이상). 연락처 문항과 동일하게 줄마다 라벨+입력";
    case "likert_7":
      return "options 불필요. maxSelections=척도 크기(2~10, 기본 5). likertScaleLabels=점수별 라벨(string[], index0=1점)";
    case "likert_multi":
      return "options=평가 항목(string[], 2개 이상). maxSelections=척도 크기. likertScaleLabels=점수별 라벨";
    case "star_rating":
      return "options 불필요 (0~5점 별점)";
    case "info_media":
      return "infoBody (string, 안내 본문), media는 관리자가 별도 업로드 — AI는 infoBody만";
    case "contact_fields":
      return "options = 항목 라벨 (string[], 1개 이상, 예: 연락처/이름/소속 부서)";
    default:
      return "";
  }
}
