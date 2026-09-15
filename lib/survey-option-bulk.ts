/** 보기 일괄입력: 줄바꿈(\n)으로 구분된 텍스트 → 보기 배열 */
export function parseBulkOptionText(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export const MAX_SURVEY_OPTION_TEMPLATE_OPTIONS = 50;
export const MAX_SURVEY_OPTION_TEMPLATE_TITLE_LENGTH = 80;
export const MAX_SURVEY_OPTION_LABEL_LENGTH = 500;
