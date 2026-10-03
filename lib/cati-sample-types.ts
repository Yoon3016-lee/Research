import type { SurveyAnswerInput } from "@/lib/survey-public";

export type CatiDraft = {
  answers: SurveyAnswerInput[];
  activeQuestionId: string | null;
  updatedAt: string;
  startedAt: string | null;
  activeSeconds: number;
};

export type CatiExtraField = {
  /** Excel 열 문자 */
  letter: string;
  label: string;
  value: string;
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
  /** 표본 관리에서 「열 추가」로 지정한 추가 열 */
  extraFields: CatiExtraField[];
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
