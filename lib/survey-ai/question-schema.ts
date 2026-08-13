import {
  DEFAULT_LIKERT_SCALE_SIZE,
  MAX_LIKERT_SCALE_SIZE,
  MIN_LIKERT_SCALE_SIZE,
} from "@/lib/likert-scale";
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
    "",
    "리커트 척도(likert_7·likert_multi) 작성 규칙:",
    `- maxSelections: 척도 크기 (${MIN_LIKERT_SCALE_SIZE}~${MAX_LIKERT_SCALE_SIZE}, 기본 ${DEFAULT_LIKERT_SCALE_SIZE}). options 필드는 사용하지 않음(likert_7) 또는 평가 항목만(likert_multi).`,
    "- likertScaleLabels: string[] — **1점부터 N점까지 각 점수에 표시할 라벨**. 배열 길이는 maxSelections와 반드시 동일. index 0 = 1점, index N-1 = N점.",
    "- **방향: 1점=긍정문, N점=부정문** (왼쪽 긍정 → 오른쪽 부정).",
    "- likert_7 예: maxSelections 5, likertScaleLabels [\"매우 그렇다\",\"그렇다\",\"보통\",\"그렇지 않다\",\"전혀 그렇지 않다\"]",
    "- likert_multi 예: options [\"품질\",\"가격\",\"서비스\"], maxSelections 5, likertScaleLabels [\"매우 높음\",\"높음\",\"보통\",\"낮음\",\"매우 낮음\"] — 모든 하위 항목에 동일 척도·라벨 적용",
    "- likert_7·likert_multi 생성 시 likertScaleLabels를 생략하거나 길이가 맞지 않게 두지 마세요. 양끝만 채우지 말고 중간 점수에도 의미 있는 라벨을 넣으세요.",
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
      return "options 불필요. maxSelections=척도 크기(2~10, 기본 5). likertScaleLabels=1~N점 각각의 라벨(string[], 길이=maxSelections, 필수)";
    case "likert_multi":
      return "options=평가 항목(string[], 2개 이상). maxSelections=척도 크기(기본 5). likertScaleLabels=1~N점 각각의 라벨(string[], 길이=maxSelections, 필수)";
    case "star_rating":
      return "options 불필요 (0~5점 별점)";
    case "info_media":
      return 'prompt는 항상 "안내"(SQ 번호 붙이지 않음). infoBody (string, 필수 — 응답자에게 보여줄 안내 본문). media는 관리자 별도 업로드';
    case "contact_fields":
      return "options = 항목 라벨 (string[], 1개 이상, 예: 연락처/이름/소속 부서)";
    default:
      return "";
  }
}
