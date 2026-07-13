import "server-only";

import { normalizeCatiOutcomeValue } from "@/lib/cati-outcomes";
import type {
  SurveySampleBatchSummary,
  SurveySampleColumnMapping,
} from "@/lib/survey-sample-types";
import { buildSurveySampleRows, serializeColumnHeaders } from "@/lib/survey-sample-parse";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

const INSERT_CHUNK = 400;

type BatchRow = {
  id: string;
  version_number: number;
  original_filename: string;
  uid_column: string;
  phone_column: string;
  outcome_column: string;
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
      "id, version_number, original_filename, uid_column, phone_column, outcome_column, column_headers, row_count, status, is_active, error_message, created_at, uploaded_by",
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
}): Promise<
  | { ok: true; batchId: string; versionNumber: number; rowCount: number }
  | { ok: false; error: string }
> {
  const surveyId = await resolveSurveyId(params.surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  let parsed: ReturnType<typeof buildSurveySampleRows>;
  try {
    parsed = buildSurveySampleRows(params.fileBuffer, params.mapping);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "엑셀 파일을 읽을 수 없습니다.",
    };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: latest } = await admin
    .from("survey_sample_batches")
    .select("version_number")
    .eq("survey_id", surveyId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = ((latest?.version_number as number | undefined) ?? 0) + 1;

  const { data: batch, error: batchError } = await admin
    .from("survey_sample_batches")
    .insert({
      survey_id: surveyId,
      version_number: versionNumber,
      original_filename: params.originalFilename,
      uid_column: params.mapping.uidColumn,
      phone_column: params.mapping.phoneColumn,
      outcome_column: params.mapping.outcomeColumn,
      column_headers: serializeColumnHeaders(parsed.columns),
      row_count: 0,
      uploaded_by: params.uploadedBy,
      status: "uploading",
      is_active: false,
    })
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
        chunk.map((row) => ({
          batch_id: batchId,
          survey_id: surveyId,
          row_index: row.rowIndex,
          uid: row.uid,
          phone: row.phone,
          row_data: row.rowData,
          outcome_value: normalizeCatiOutcomeValue(row.rowData[params.mapping.outcomeColumn]),
        })),
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

    return {
      ok: true,
      batchId,
      versionNumber,
      rowCount: parsed.rows.length,
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

  return { ok: true };
}
