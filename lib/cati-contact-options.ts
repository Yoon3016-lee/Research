import "server-only";

import {
  defaultCatiContactOptions,
  MAX_CATI_CONTACT_LABEL_LENGTH,
  MAX_CATI_CONTACT_OPTIONS,
  type CatiContactOption,
  type CatiContactOptionInput,
} from "@/lib/cati-contact-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

type ContactOptionRow = {
  id: string;
  position: number;
  label: string;
  is_success: boolean;
  is_active: boolean;
};

function mapRow(row: ContactOptionRow): CatiContactOption {
  return {
    id: row.id,
    position: row.position,
    label: row.label,
    isSuccess: row.is_success,
    isActive: row.is_active,
  };
}

/** 전체 설문 공통(전역) 컨택 선택지 — 없으면 앱 내장 기본값 */
export async function listGlobalCatiContactOptions(): Promise<{
  options: CatiContactOption[];
  usingDefaults: boolean;
}> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { options: defaultCatiContactOptions(), usingDefaults: true };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("cati_contact_options_global")
    .select("id, position, label, is_success, is_active")
    .order("position", { ascending: true });

  if (error || !data?.length) {
    return { options: defaultCatiContactOptions(), usingDefaults: true };
  }

  return { options: (data as ContactOptionRow[]).map(mapRow), usingDefaults: false };
}

/** 조사원 화면용 — 활성 선택지만 (전역 공통) */
export async function listActiveCatiContactOptions(): Promise<CatiContactOption[]> {
  const { options } = await listGlobalCatiContactOptions();
  return options.filter((o) => o.isActive);
}

/** 선택된 optionId를 검증하고 라벨·성공여부 반환 (전역 공통) */
export async function resolveCatiContactOutcome(
  optionId: string,
): Promise<{ label: string; isSuccess: boolean } | null> {
  const { options } = await listGlobalCatiContactOptions();
  const found = options.find((o) => o.id === optionId && o.isActive);
  if (!found) return null;
  return { label: found.label, isSuccess: found.isSuccess };
}

type CleanedOption = { label: string; isSuccess: boolean; isActive: boolean };

function cleanContactInputs(
  inputs: CatiContactOptionInput[],
): { ok: true; cleaned: CleanedOption[] } | { ok: false; error: string } {
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

  return { ok: true, cleaned };
}

/** 전체 설문 공통(전역) 컨택 선택지 저장 */
export async function saveGlobalCatiContactOptions(
  inputs: CatiContactOptionInput[],
): Promise<{ ok: true; options: CatiContactOption[] } | { ok: false; error: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "서버 설정이 완료되지 않았습니다." };
  }

  const validated = cleanContactInputs(inputs);
  if (!validated.ok) return validated;
  const { cleaned } = validated;

  const admin = createSupabaseServiceRoleClient();

  const { error: deleteError } = await admin
    .from("cati_contact_options_global")
    .delete()
    .neq("position", 0);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const rows = cleaned.map((c, i) => ({
    position: i + 1,
    label: c.label,
    is_success: c.isSuccess,
    is_active: c.isActive,
  }));

  const { data, error } = await admin
    .from("cati_contact_options_global")
    .insert(rows)
    .select("id, position, label, is_success, is_active")
    .order("position", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, options: (data as ContactOptionRow[]).map(mapRow) };
}
