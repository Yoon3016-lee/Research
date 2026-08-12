import "server-only";

import { normalizeCatiOutcomeValue } from "@/lib/cati-outcomes";
import { ensureBatchInviteTokens } from "@/lib/survey-invite-token";
import type { ParticipationFormat } from "@/lib/survey-participation-format";
import { columnLetterToIndex } from "@/lib/survey-sample-columns";
import type {
  SurveySampleBatchDataPreview,
  SurveySampleBatchSummary,
  SurveySampleColumnMapping,
} from "@/lib/survey-sample-types";
import { buildSurveySampleRows, serializeColumnHeaders } from "@/lib/survey-sample-parse";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

const INSERT_CHUNK = 400;

type BatchRow = {
  id: string;
  version_number: number;
  original_filename: string;
  uid_column: string;
  phone_column: string;
  outcome_column: string;
  email_column?: string | null;
  name_column?: string | null;
  column_headers: unknown;
  row_count: number;
  status: string;
  is_active: boolean;
  error_message: string | null;
  created_at: string;
  uploaded_by: string | null;
};

function mapBatch(row: BatchRow, uploadedByEmail: string | null): SurveySampleBatchSummary {
  const headers = Array.isArray(row.column_headers)
    ? row.column_headers.filter((h): h is string => typeof h === "string")
    : [];

  return {
    id: row.id,
    versionNumber: row.version_number,
    originalFilename: row.original_filename,
    uidColumn: row.uid_column,
    phoneColumn: row.phone_column,
    outcomeColumn: row.outcome_column,
    emailColumn: row.email_column ?? null,
    nameColumn: row.name_column ?? null,
    columnHeaders: headers,
    rowCount: row.row_count,
    status: row.status as SurveySampleBatchSummary["status"],
    isActive: row.is_active,
    errorMessage: row.error_message,
    uploadedByEmail,
    createdAt: row.created_at,
  };
}

async function resolveSurveyId(ref: string): Promise<string | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  let query = admin.from("surveys").select("id");
  query = isUuid(normalized) ? query.eq("id", normalized) : query.eq("slug", normalized);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function listSurveySampleBatches(
  surveyRef: string,
): Promise<{ surveyId: string | null; batches: SurveySampleBatchSummary[] }> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { surveyId: null, batches: [] };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_sample_batches")
    .select(
      "id, version_number, original_filename, uid_column, phone_column, outcome_column, email_column, name_column, column_headers, row_count, status, is_active, error_message, created_at, uploaded_by",
    )
    .eq("survey_id", surveyId)
    .order("version_number", { ascending: false });

  if (error || !data?.length) {
    return { surveyId, batches: [] };
  }

  const uploaderIds = [
    ...new Set((data as BatchRow[]).map((r) => r.uploaded_by).filter(Boolean)),
  ] as string[];

  const emailById = new Map<string, string>();
  if (uploaderIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", uploaderIds);
    for (const p of profiles ?? []) {
      if (p.email) emailById.set(p.id as string, p.email as string);
    }
  }

  return {
    surveyId,
    batches: (data as BatchRow[]).map((row) =>
      mapBatch(row, row.uploaded_by ? emailById.get(row.uploaded_by) ?? null : null),
    ),
  };
}

function isConcurrentUploadError(message: string): boolean {
  return (
    message.includes("survey_sample_batches_one_uploading_idx") ||
    (message.includes("duplicate key value") && message.includes("uploading"))
  );
}

export async function uploadSurveySampleBatch(params: {
  surveyRef: string;
  uploadedBy: string;
  originalFilename: string;
  mapping: SurveySampleColumnMapping;
  fileBuffer: Buffer;
  participationFormat?: ParticipationFormat;
}): Promise<
  | {
      ok: true;
      batchId: string;
      versionNumber: number;
      rowCount: number;
      warnings?: import("@/lib/survey-sample-types").SurveySampleUploadWarnings;
    }
  | { ok: false; error: string }
> {
  const format = params.participationFormat ?? "site";
  const surveyId = await resolveSurveyId(params.surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: surveyMeta } = await admin
    .from("surveys")
    .select("samples_locked_at, participation_format")
    .eq("id", surveyId)
    .maybeSingle();

  if (surveyMeta?.samples_locked_at) {
    return {
      ok: false,
      error: "이메일 발송 후에는 표본을 다시 업로드할 수 없습니다.",
    };
  }

  if (format === "email" && surveyMeta?.participation_format !== "email") {
    return { ok: false, error: "이메일 형식 설문에서만 이메일 표본을 업로드할 수 있습니다." };
  }

  let parsed: ReturnType<typeof buildSurveySampleRows>;
  try {
    parsed = buildSurveySampleRows(params.fileBuffer, params.mapping, format);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "엑셀 파일을 읽을 수 없습니다.",
    };
  }

  const versionNumber = await (async () => {
    const { data: latest } = await admin
      .from("survey_sample_batches")
      .select("version_number")
      .eq("survey_id", surveyId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    return ((latest?.version_number as number | undefined) ?? 0) + 1;
  })();

  const batchInsert: Record<string, unknown> = {
    survey_id: surveyId,
    version_number: versionNumber,
    original_filename: params.originalFilename,
    uid_column: params.mapping.uidColumn,
    phone_column: format === "site" ? (params.mapping.phoneColumn ?? "-") : "-",
    outcome_column: format === "site" ? (params.mapping.outcomeColumn ?? "-") : "-",
    column_headers: serializeColumnHeaders(parsed.columns),
    row_count: 0,
    uploaded_by: params.uploadedBy,
    status: "uploading",
    is_active: false,
  };
  if (format === "email") {
    batchInsert.email_column = params.mapping.emailColumn ?? null;
    batchInsert.name_column = params.mapping.nameColumn ?? null;
  }

  const { data: batch, error: batchError } = await admin
    .from("survey_sample_batches")
    .insert(batchInsert)
    .select("id")
    .single();

  if (batchError || !batch) {
    if (batchError && isConcurrentUploadError(batchError.message)) {
      return {
        ok: false,
        error:
          "다른 관리자가 같은 설문에 표본을 업로드 중입니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    if (batchError?.message.includes("survey_sample_batches_survey_version_unique")) {
      return {
        ok: false,
        error: "버전 충돌이 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
    return { ok: false, error: batchError?.message ?? "배치 생성에 실패했습니다." };
  }

  const batchId = batch.id as string;

  try {
    for (let offset = 0; offset < parsed.rows.length; offset += INSERT_CHUNK) {
      const chunk = parsed.rows.slice(offset, offset + INSERT_CHUNK);
      const { error: insertError } = await admin.from("survey_samples").insert(
        chunk.map((row) => {
          const base = {
            batch_id: batchId,
            survey_id: surveyId,
            row_index: row.rowIndex,
            uid: row.uid,
            phone: row.phone,
            email: row.email ?? "",
            row_data: row.rowData,
          };
          if (format === "site") {
            return {
              ...base,
              outcome_value: normalizeCatiOutcomeValue(
                row.rowData[params.mapping.outcomeColumn ?? ""],
              ),
            };
          }
          return base;
        }),
      );

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const { error: deactivateError } = await admin
      .from("survey_sample_batches")
      .update({ is_active: false })
      .eq("survey_id", surveyId)
      .neq("id", batchId);

    if (deactivateError) {
      throw new Error(deactivateError.message);
    }

    const { error: finalizeError } = await admin
      .from("survey_sample_batches")
      .update({
        status: "ready",
        is_active: true,
        row_count: parsed.rows.length,
        error_message: null,
      })
      .eq("id", batchId);

    if (finalizeError) {
      throw new Error(finalizeError.message);
    }

    if (format === "email") {
      await ensureBatchInviteTokens(batchId);
    }

    return {
      ok: true,
      batchId,
      versionNumber,
      rowCount: parsed.rows.length,
      warnings: parsed.warnings,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "표본 저장에 실패했습니다.";
    await admin
      .from("survey_sample_batches")
      .update({ status: "failed", error_message: message, is_active: false })
      .eq("id", batchId);
    await admin.from("survey_samples").delete().eq("batch_id", batchId);
    return { ok: false, error: message };
  }
}

export async function activateSurveySampleBatch(
  surveyRef: string,
  batchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: batch, error: readError } = await admin
    .from("survey_sample_batches")
    .select("id, status")
    .eq("id", batchId)
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (readError || !batch) {
    return { ok: false, error: "표본 버전을 찾을 수 없습니다." };
  }
  if (batch.status !== "ready") {
    return { ok: false, error: "완료된 표본 버전만 적용할 수 있습니다." };
  }

  const { error: deactivateError } = await admin
    .from("survey_sample_batches")
    .update({ is_active: false })
    .eq("survey_id", surveyId);

  if (deactivateError) {
    return { ok: false, error: deactivateError.message };
  }

  const { error: activateError } = await admin
    .from("survey_sample_batches")
    .update({ is_active: true })
    .eq("id", batchId);

  if (activateError) {
    return { ok: false, error: activateError.message };
  }

  await ensureBatchInviteTokens(batchId);

  return { ok: true };
}

const PREVIEW_LIMIT = 10;

export async function getSurveySampleBatchPreview(
  surveyRef: string,
  batchId: string,
): Promise<{ ok: true; preview: SurveySampleBatchDataPreview } | { ok: false; error: string }> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: batch, error: batchError } = await admin
    .from("survey_sample_batches")
    .select(
      "id, version_number, original_filename, uid_column, phone_column, outcome_column, column_headers, row_count, status",
    )
    .eq("id", batchId)
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (batchError || !batch) {
    return { ok: false, error: "표본 버전을 찾을 수 없습니다." };
  }
  if (batch.status !== "ready") {
    return { ok: false, error: "완료된 표본 버전만 미리볼 수 있습니다." };
  }

  const { data: samples, error: samplesError } = await admin
    .from("survey_samples")
    .select("row_index, uid, phone, row_data")
    .eq("batch_id", batchId)
    .order("row_index", { ascending: true })
    .limit(PREVIEW_LIMIT);

  if (samplesError) {
    return { ok: false, error: samplesError.message };
  }

  const headers = Array.isArray(batch.column_headers)
    ? batch.column_headers.filter((h): h is string => typeof h === "string")
    : [];

  const rows = (samples ?? []).map((s) => {
    const rowData =
      s.row_data && typeof s.row_data === "object"
        ? (s.row_data as Record<string, unknown>)
        : {};
    const cells: Record<string, string> = {};
    for (const [k, v] of Object.entries(rowData)) {
      cells[k] = v == null ? "" : String(v);
    }
    if (!cells[batch.uid_column as string]) {
      cells[batch.uid_column as string] = String(s.uid ?? "");
    }
    if (!cells[batch.phone_column as string]) {
      cells[batch.phone_column as string] = String(s.phone ?? "");
    }
    return {
      rowIndex: s.row_index as number,
      cells,
    };
  });

  return {
    ok: true,
    preview: {
      batchId: batch.id as string,
      versionNumber: batch.version_number as number,
      originalFilename: batch.original_filename as string,
      uidColumn: batch.uid_column as string,
      phoneColumn: batch.phone_column as string,
      outcomeColumn: batch.outcome_column as string,
      columnHeaders: headers,
      totalRows: batch.row_count as number,
      rows,
    },
  };
}

export async function buildSurveySampleBatchExcel(
  surveyRef: string,
  batchId: string,
): Promise<
  | { ok: true; filename: string; buffer: Buffer }
  | { ok: false; error: string }
> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: batch, error: batchError } = await admin
    .from("survey_sample_batches")
    .select(
      "id, version_number, original_filename, uid_column, phone_column, outcome_column, column_headers, status",
    )
    .eq("id", batchId)
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (batchError || !batch) {
    return { ok: false, error: "표본 버전을 찾을 수 없습니다." };
  }
  if (batch.status !== "ready") {
    return { ok: false, error: "완료된 표본 버전만 다운로드할 수 있습니다." };
  }

  const { data: samples, error: samplesError } = await admin
    .from("survey_samples")
    .select("row_index, uid, phone, row_data, outcome_value")
    .eq("batch_id", batchId)
    .order("row_index", { ascending: true });

  if (samplesError) {
    return { ok: false, error: samplesError.message };
  }

  const headers = Array.isArray(batch.column_headers)
    ? batch.column_headers.filter((h): h is string => typeof h === "string")
    : [];

  const letterSet = new Set<string>();
  for (const s of samples ?? []) {
    const rowData =
      s.row_data && typeof s.row_data === "object"
        ? (s.row_data as Record<string, unknown>)
        : {};
    for (const key of Object.keys(rowData)) letterSet.add(key);
  }
  letterSet.add(batch.uid_column as string);
  letterSet.add(batch.phone_column as string);
  letterSet.add(batch.outcome_column as string);

  const letters = [...letterSet].sort(
    (a, b) => columnLetterToIndex(a) - columnLetterToIndex(b),
  );

  const headerRow = letters.map((letter) => {
    const idx = columnLetterToIndex(letter);
    const h = idx >= 0 ? headers[idx]?.trim() : "";
    return h || letter;
  });

  const matrix: (string | number)[][] = [headerRow];
  for (const s of samples ?? []) {
    const rowData =
      s.row_data && typeof s.row_data === "object"
        ? (s.row_data as Record<string, unknown>)
        : {};
    matrix.push(
      letters.map((letter) => {
        if (letter === batch.uid_column) return String(s.uid ?? rowData[letter] ?? "");
        if (letter === batch.phone_column) return String(s.phone ?? rowData[letter] ?? "");
        if (letter === batch.outcome_column) {
          return String(s.outcome_value ?? rowData[letter] ?? "");
        }
        const v = rowData[letter];
        return v == null ? "" : String(v);
      }),
    );
  }

  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "samples");
  const buffer = Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer,
  );

  const baseName =
    String(batch.original_filename ?? "samples")
      .replace(/\.(xlsx|xls)$/i, "")
      .replace(/[^\w가-힣.-]+/g, "_")
      .slice(0, 80) || "samples";

  return {
    ok: true,
    filename: `${baseName}-v${batch.version_number}.xlsx`,
    buffer,
  };
}
