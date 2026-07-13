export type SurveyViewMode = "paged" | "scroll";

export const DEFAULT_SURVEY_VIEW_MODE: SurveyViewMode = "paged";

export function isSurveyViewMode(value: unknown): value is SurveyViewMode {
  return value === "paged" || value === "scroll";
}

export const SURVEY_VIEW_MODE_LABELS: Record<SurveyViewMode, string> = {
  paged: "페이지 넘김",
  scroll: "스크롤",
};

export const SURVEY_VIEW_MODE_DESCRIPTIONS: Record<SurveyViewMode, string> = {
  paged: "한 번에 한 문항씩 보고 이전·다음으로 이동합니다.",
  scroll: "모든 문항을 한 화면에서 위아래로 스크롤하며 응답합니다.",
};
