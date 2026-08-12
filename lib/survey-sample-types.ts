export type SurveySampleBatchStatus = "uploading" | "ready" | "failed";

export type SurveySampleColumnInfo = {
  /** Excel 열 문자 (A, B, …, ZZ) */
  letter: string;
  index: number;
  /** 선택 UI용 힌트(있을 경우) — 업로드 로직과 무관 */
  headerLabel: string;
};

export type SurveySampleBatchSummary = {
  id: string;
  versionNumber: number;
  originalFilename: string;
  uidColumn: string;
  phoneColumn: string;
  outcomeColumn: string;
  emailColumn?: string | null;
  nameColumn?: string | null;
  columnHeaders: string[];
  rowCount: number;
  status: SurveySampleBatchStatus;
  isActive: boolean;
  errorMessage: string | null;
  uploadedByEmail: string | null;
  createdAt: string;
};

export type SurveySamplePreviewRow = {
  rowIndex: number;
  /** Excel 열 문자(A, B, …) → 셀 값 */
  cells: Record<string, string>;
};

export type SurveySampleSpreadsheetPreview = {
  columns: SurveySampleColumnInfo[];
  rows: SurveySamplePreviewRow[];
  /** 스캔한 비어 있지 않은 행 수 */
  totalRows: number;
  /** UID가 있어 실제 업로드되는 행 수 */
  importableRows: number;
  suggestedColumns?: SurveySampleColumnMapping;
};

export type SurveySampleColumnMapping = {
  /** Excel 열 문자 — 예: A, E, H */
  uidColumn: string;
  phoneColumn?: string;
  outcomeColumn?: string;
  /** 이메일 형식 */
  emailColumn?: string;
  nameColumn?: string;
};

export type SurveySampleUploadWarnings = {
  duplicateEmails: { email: string; uids: string[] }[];
  invalidEmails: { uid: string; email: string; rowIndex: number }[];
};

export type SurveySampleUploadResult =
  | {
      ok: true;
      batchId: string;
      versionNumber: number;
      rowCount: number;
      warnings?: SurveySampleUploadWarnings;
    }
  | { ok: false; error: string };

export type SurveySamplePreviewResult =
  | { ok: true; preview: SurveySampleSpreadsheetPreview }
  | { ok: false; error: string };

export type SurveySampleBatchDataPreview = {
  batchId: string;
  versionNumber: number;
  originalFilename: string;
  uidColumn: string;
  phoneColumn: string;
  outcomeColumn: string;
  emailColumn?: string | null;
  nameColumn?: string | null;
  columnHeaders: string[];
  totalRows: number;
  rows: SurveySamplePreviewRow[];
};

export type SurveySampleBatchPreviewResult =
  | { ok: true; preview: SurveySampleBatchDataPreview }
  | { ok: false; error: string };
