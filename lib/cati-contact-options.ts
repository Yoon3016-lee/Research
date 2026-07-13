import "server-only";

import {
  defaultCatiContactOptions,
  MAX_CATI_CONTACT_LABEL_LENGTH,
  MAX_CATI_CONTACT_OPTIONS,
  type CatiContactOption,
  type CatiContactOptionInput,
} from "@/lib/cati-contact-types";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

type ContactOptionRow = {
  id: string;
  position: number;
  label: string;
  is_success: boolean;
  is_active: boolean;
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

function mapRow(row: ContactOptionRow): CatiContactOption {
  return {
    id: row.id,
    position: row.position,
    label: row.label,
    isSuccess: row.is_success,
    isActive: row.is_active,
  };
}

export async function listCatiContactOptions(surveyRef: string): Promise<{
  surveyId: string | null;
  options: CatiContactOption[];
  usingDefaults: boolean;
}> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { surveyId: null, options: defaultCatiContactOptions(), usingDefaults: true };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_contact_options")
    .select("id, position, label, is_success, is_active")
    .eq("survey_id", surveyId)
    .order("position", { ascending: true });

  if (error || !data?.length) {
    return { surveyId, options: defaultCatiContactOptions(), usingDefaults: true };
  }

  return { surveyId, options: (data as ContactOptionRow[]).map(mapRow), usingDefaults: false };
}

/** 조사원 화면용 — 활성 선택지만 */
export async function listActiveCatiContactOptions(
  surveyRef: string,
): Promise<CatiContactOption[]> {
  const { options } = await listCatiContactOptions(surveyRef);
  return options.filter((o) => o.isActive);
}

/** 선택된 optionId를 검증하고 라벨·성공여부 반환 */
export async function resolveCatiContactOutcome(
  surveyRef: string,
  optionId: string,
): Promise<{ label: string; isSuccess: boolean } | null> {
  const { options } = await listCatiContactOptions(surveyRef);
  const found = options.find((o) => o.id === optionId && o.isActive);
  if (!found) return null;
  return { label: found.label, isSuccess: found.isSuccess };
}

export async function saveCatiContactOptions(
  surveyRef: string,
  inputs: CatiContactOptionInput[],
): Promise<{ ok: true; options: CatiContactOption[] } | { ok: false; error: string }> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const cleaned = inputs
    .map((i) => ({
      label: i.label.trim(),
      isSuccess: Boolean(i.isSuccess),
      isActive: Boolean(i.isActive),
    }))
    .filter((i) => i.label.length > 0);

  if (cleaned.length === 0) {
    return { ok: false, error: "컨택 결과 선택지는 최소 1개 이상이어야 합니다." };
  }
  if (cleaned.length > MAX_CATI_CONTACT_OPTIONS) {
    return {
      ok: false,
      error: `선택지는 최대 ${MAX_CATI_CONTACT_OPTIONS}개까지 등록할 수 있습니다.`,
    };
  }
  if (cleaned.some((c) => c.label.length > MAX_CATI_CONTACT_LABEL_LENGTH)) {
    return {
      ok: false,
      error: `선택지 이름은 ${MAX_CATI_CONTACT_LABEL_LENGTH}자 이하여야 합니다.`,
    };
  }

  const labels = cleaned.map((c) => c.label);
  if (new Set(labels).size !== labels.length) {
    return { ok: false, error: "중복된 선택지 이름이 있습니다." };
  }
  if (!cleaned.some((c) => c.isActive)) {
    return { ok: false, error: "활성 선택지가 최소 1개 이상이어야 합니다." };
  }

  const admin = createSupabaseServiceRoleClient();

  const { error: deleteError } = await admin
    .from("survey_contact_options")
    .delete()
    .eq("survey_id", surveyId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const rows = cleaned.map((c, i) => ({
    survey_id: surveyId,
    position: i + 1,
    label: c.label,
    is_success: c.isSuccess,
    is_active: c.isActive,
  }));

  const { data, error } = await admin
    .from("survey_contact_options")
    .insert(rows)
    .select("id, position, label, is_success, is_active")
    .order("position", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, options: (data as ContactOptionRow[]).map(mapRow) };
}
