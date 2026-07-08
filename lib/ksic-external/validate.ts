import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { KSIC_REVISION } from "@/lib/ksic-types";
import {
  KSURE_INDUSTRY_LEVEL_SOURCE,
  type KsicExternalSyncRun,
  type KsicExternalValidation,
} from "@/lib/ksic-external/types";

async function getLatestExternalSyncRun(): Promise<KsicExternalSyncRun | null> {
  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("ksic_external_sync_runs")
    .select(
      "id, source, revision, status, started_at, finished_at, records_upserted, diff_summary",
    )
    .eq("source", KSURE_INDUSTRY_LEVEL_SOURCE)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    source: data.source,
    revision: data.revision,
    status: data.status as KsicExternalSyncRun["status"],
    startedAt: data.started_at,
    finishedAt: data.finished_at,
    recordsUpserted: data.records_upserted ?? 0,
    diffSummary: (data.diff_summary ?? {}) as KsicExternalSyncRun["diffSummary"],
  };
}

async function lookupExternalCodeDb(
  code: string,
): Promise<{ code: string; nameKo: string; industryLevel: number | null; syncedAt: string } | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("ksic_external_codes")
    .select("code, name_ko, industry_level, synced_at")
    .eq("revision", KSIC_REVISION)
    .eq("source", KSURE_INDUSTRY_LEVEL_SOURCE)
    .eq("code", trimmed)
    .maybeSingle();

  if (error || !data) return null;

  return {
    code: data.code,
    nameKo: data.name_ko,
    industryLevel: data.industry_level,
    syncedAt: data.synced_at,
  };
}

export async function validateKsicExternalDb(code: string): Promise<KsicExternalValidation> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { code: "", status: "missing_in_local", message: "KSIC 코드를 입력하세요." };
  }

  const latest = await getLatestExternalSyncRun();
  if (!latest || latest.status !== "success") {
    return {
      code: trimmed,
      status: "no_snapshot",
      message:
        "외부 KSIC 검증 스냅샷이 없습니다. `npm run db:sync-ksic-external` 실행 후 다시 확인하세요.",
      lastSyncedAt: latest?.finishedAt ?? null,
    };
  }

  const admin = createSupabaseServiceRoleClient();

  const [{ data: local }, external] = await Promise.all([
    admin
      .from("ksic_codes")
      .select("code, name_ko")
      .eq("revision", KSIC_REVISION)
      .eq("code", trimmed)
      .maybeSingle(),
    lookupExternalCodeDb(trimmed),
  ]);

  if (!local) {
    return {
      code: trimmed,
      status: "missing_in_local",
      message: `로컬 KSIC DB에 코드 ${trimmed}가 없습니다.`,
      externalName: external?.nameKo,
      industryLevel: external?.industryLevel,
      lastSyncedAt: latest.finishedAt,
    };
  }

  if (!external) {
    return {
      code: trimmed,
      status: "missing_in_external",
      message: `무역보험공사 업종 목록에 코드 ${trimmed}가 없습니다. 로컬 데이터 갱신 또는 코드 확인이 필요할 수 있습니다.`,
      localName: local.name_ko,
      lastSyncedAt: latest.finishedAt,
    };
  }

  const localName = local.name_ko.trim();
  const externalName = external.nameKo.trim();
  if (localName && externalName && localName !== externalName) {
    return {
      code: trimmed,
      status: "name_mismatch",
      message: `코드 ${trimmed}의 명칭이 로컬·외부 목록에서 다릅니다.`,
      localName,
      externalName,
      industryLevel: external.industryLevel,
      lastSyncedAt: latest.finishedAt,
    };
  }

  return {
    code: trimmed,
    status: "ok",
    message: "로컬 KSIC와 무역보험공사 업종 목록이 일치합니다.",
    localName,
    externalName,
    industryLevel: external.industryLevel,
    lastSyncedAt: latest.finishedAt,
  };
}
