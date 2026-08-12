import type { SurveyAnswerInput } from "@/lib/survey-public";

export type CatiDraft = {
  answers: SurveyAnswerInput[];
  activeQuestionId: string | null;
  updatedAt: string;
  startedAt: string | null;
  activeSeconds: number;
};

export type CatiAppliedSample = {
  id: string;
  uid: string;
  phone: string;
  outcomeValue: string | null;
  statusLabel: string;
  statusDescription: string;
  statusTone: "new" | "info" | "warning" | "success" | "muted";
  batchVersion: number;
  draft: CatiDraft | null;
};

export type CatiSaveDraftResult =
  | { ok: true }
  | { ok: false; error: string };

export type CatiApplyResult =
  | { ok: true; sample: CatiAppliedSample }
  | { ok: false; error: string };

export type CatiRecordOutcomeResult =
  | { ok: true; outcome: string }
  | { ok: false; error: string };

export type CatiContactOutcomeResult =
  | { ok: true; outcome: string; isSuccess: boolean }
  | { ok: false; error: string };
