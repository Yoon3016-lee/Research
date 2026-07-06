export const KSURE_INDUSTRY_LEVEL_SOURCE = "ksure_industry_level";

export type KsicExternalSyncStatus = "running" | "success" | "failed";

export type KsicExternalSyncRun = {
  id: string;
  source: string;
  revision: number;
  status: KsicExternalSyncStatus;
  startedAt: string;
  finishedAt: string | null;
  recordsUpserted: number;
  diffSummary: KsicExternalDiffSummary;
};

export type KsicExternalDiffSummary = {
  externalTotal?: number;
  localTotal?: number;
  onlyExternalCount?: number;
  onlyLocalCount?: number;
  nameMismatchCount?: number;
};

export type KsicExternalValidationStatus =
  | "ok"
  | "missing_in_local"
  | "missing_in_external"
  | "name_mismatch"
  | "no_snapshot";

export type KsicExternalValidation = {
  code: string;
  status: KsicExternalValidationStatus;
  message: string;
  localName?: string;
  externalName?: string;
  industryLevel?: number | null;
  lastSyncedAt?: string | null;
};
