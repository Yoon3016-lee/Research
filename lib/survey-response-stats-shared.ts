import type { QuestionType } from "@/lib/survey-types";
import type { DurationSummary } from "@/lib/survey-duration";

export const NO_ANSWER_LABEL = "무응답";

export type FrequencyBucket = {
  key: string;
  label: string;
  count: number;
  percent: number;
  staffCount: number;
  guestCount: number;
};

export type QuestionFrequencyStats = {
  questionId: string;
  orderIndex: number;
  prompt: string;
  type: QuestionType;
  allowSkip: boolean;
  totalSubmissions: number;
  answeredCount: number;
  noAnswerCount: number;
  buckets: FrequencyBucket[];
};

export type SurveyResponseStats =
  | {
      ok: true;
      slug: string;
      title: string;
      totalSubmissions: number;
      duration: DurationSummary;
      questions: QuestionFrequencyStats[];
    }
  | { ok: false; reason: "not_configured" | "not_found" };
