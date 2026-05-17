export type SurveyStatus = "진행중" | "예정" | "종료";

export type OngoingSurvey = {
  id: string;
  title: string;
  summary: string;
  periodLabel: string;
  responseCount: number;
  targetCount: number;
  status: SurveyStatus;
};

export type AdminSurveyRow = {
  id: string;
  title: string;
  updatedAt: string;
  status: SurveyStatus;
  responses: number;
  targetCount?: number;
};
