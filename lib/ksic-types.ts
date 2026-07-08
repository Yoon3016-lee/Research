/** KSIC 검색·선택 UI / 서버 액션 공용 */
export type KsicEntry = {
  code: string;
  name: string;
  levelName: string;
  pathKo: string;
  levelNumber: number;
  /** 하위 분류 개수 (0이면 말단) */
  childCount: number;
  /** 대분류 코드 범위 (예: 01~03) */
  majorCodeRange?: string;
  /** 검색어가 포함 예시 품목과 매칭된 경우 (검색 결과 표시용) */
  matchedExample?: string;
};

export const KSIC_REVISION = 11 as const;

/** 분류표 미리보기 패널용 */
export type KsicDetailPreview = {
  entry: KsicEntry;
  revision: number;
  nameEn: string;
  definition: string;
  examples: string[];
  exclusions: string[];
  /** 세세분류일 때 설문 AI용 요약 (있을 경우) */
  aiContextForSurvey?: string;
};
