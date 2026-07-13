import "server-only";

import { describeCatiSampleStatus, normalizeCatiOutcomeValue } from "@/lib/cati-outcomes";
import { getCatiDraft } from "@/lib/cati-drafts";
import type {
  CatiAppliedSample,
  CatiApplyResult,
  CatiDraft,
  CatiRecordOutcomeResult,
} from "@/lib/cati-sample-types";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

type SampleRow = {
  id: string;
  uid: string;
  phone: string;
  outcome_value: string | null;
  row_data: Record<string, string> | null;
  batch_id: string;
};

type BatchRow = {
  id: string;
  version_number: number;
  outcome_column: string;
  is_active: boolean;
  status: string;
};

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

async function getActiveBatch(surveyId: string): Promise<BatchRow | null> {
  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_sample_batches")
    .select("id, version_number, outcome_column, is_active, status")
    .eq("survey_id", surveyId)
    .eq("is_active", true)
    .eq("status", "ready")
    .maybeSingle();

  if (error || !data) return null;
  return data as BatchRow;
}

function mapAppliedSample(
  row: SampleRow,
  batch: BatchRow,
  draft: CatiDraft | null,
): CatiAppliedSample {
  const fromColumn = row.row_data?.[batch.outcome_column] ?? null;
  const outcomeValue = normalizeCatiOutcomeValue(row.outcome_value ?? fromColumn);
  const status = describeCatiSampleStatus(outcomeValue);
  return {
    id: row.id,
    uid: row.uid,
    phone: row.phone,
    outcomeValue,
    statusLabel: status.label,
    statusDescription: status.description,
    statusTone: status.tone,
    batchVersion: batch.version_number,
    draft,
  };
}

export async function hasActiveCatiBatch(surveyRef: string): Promise<boolean> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) return false;
  const batch = await getActiveBatch(surveyId);
  return batch != null;
}

export async function applyCatiSampleUid(
  surveyRef: string,
  uidInput: string,
): Promise<CatiApplyResult> {
  const uid = uidInput.trim();
  if (!uid) {
    return { ok: false, error: "UID를 입력하세요." };
  }

  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const batch = await getActiveBatch(surveyId);
  if (!batch) {
    return {
      ok: false,
      error: "적용된 표본 파일이 없습니다. 관리자에게 표본 업로드를 요청하세요.",
    };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_samples")
    .select("id, uid, phone, outcome_value, row_data, batch_id")
    .eq("survey_id", surveyId)
    .eq("batch_id", batch.id)
    .eq("uid", uid)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return {
      ok: false,
      error: `등록되지 않은 UID입니다. (표본 v${batch.version_number})`,
    };
  }

  const draft = await getCatiDraft((data as SampleRow).id);

  return { ok: true, sample: mapAppliedSample(data as SampleRow, batch, draft) };
}

export async function recordCatiSampleOutcome(
  surveyRef: string,
  sampleId: string,
  outcome: string,
  updatedBy: string,
): Promise<CatiRecordOutcomeResult> {
  const trimmed = normalizeCatiOutcomeValue(outcome);
  if (!trimmed) {
    return { ok: false, error: "결과 값이 비어 있습니다." };
  }

  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const batch = await getActiveBatch(surveyId);
  if (!batch) {
    return { ok: false, error: "적용된 표본 파일이 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: sample, error: readError } = await admin
    .from("survey_samples")
    .select("id, row_data")
    .eq("id", sampleId)
    .eq("survey_id", surveyId)
    .eq("batch_id", batch.id)
    .maybeSingle();

  if (readError || !sample) {
    return { ok: false, error: "표본을 찾을 수 없습니다." };
  }

  const rowData = {
    ...((sample.row_data as Record<string, string> | null) ?? {}),
    [batch.outcome_column]: trimmed,
  };

  const { error: updateError } = await admin
    .from("survey_samples")
    .update({
      outcome_value: trimmed,
      outcome_updated_at: new Date().toISOString(),
      outcome_updated_by: updatedBy,
      row_data: rowData,
    })
    .eq("id", sampleId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, outcome: trimmed };
}
