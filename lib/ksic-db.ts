import "server-only";

import ksicSeed from "@/data/ksic-seed.json";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import type { KsicDetailPreview, KsicEntry } from "@/lib/ksic-types";
import { KSIC_REVISION } from "@/lib/ksic-types";

type CodeRow = {
  code: string;
  name_ko: string;
  name_en?: string;
  level_name: string;
  path_ko: string;
  level_number: number;
  child_count?: number;
  major_code_range?: string;
  definition?: string;
  examples?: string;
  exclusions?: string;
  raw_description?: string;
  ai_context?: string;
};

const SEED = ksicSeed as { code: string; name: string; level: string; section?: string }[];

let dbReady: boolean | null = null;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s/g, "");
}

function mapRow(row: CodeRow): KsicEntry {
  return {
    code: row.code,
    name: row.name_ko,
    levelName: row.level_name,
    pathKo: row.path_ko,
    levelNumber: row.level_number,
    childCount: row.child_count ?? 0,
    majorCodeRange: row.major_code_range?.trim() || undefined,
  };
}

async function isKsicDbReady(): Promise<boolean> {
  if (dbReady !== null) return dbReady;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    dbReady = false;
    return false;
  }
  try {
    const admin = createSupabaseServiceRoleClient();
    const { count, error } = await admin
      .from("ksic_codes")
      .select("*", { count: "exact", head: true })
      .eq("revision", KSIC_REVISION);
    dbReady = !error && (count ?? 0) > 0;
  } catch {
    dbReady = false;
  }
  return dbReady;
}

function searchKsicSeed(query: string, limit: number): KsicEntry[] {
  const q = query.trim();
  if (!q) return [];
  const lower = q.toLowerCase();
  const normalizedCode = normalizeCode(q);

  const scored = SEED.map((entry) => {
    const code = normalizeCode(entry.code);
    const name = entry.name.toLowerCase();
    let score = 0;
    if (code === normalizedCode) score += 100;
    else if (code.startsWith(normalizedCode) || normalizedCode.startsWith(code)) score += 60;
    if (name.includes(lower)) score += 40;
    if (name.startsWith(lower)) score += 20;
    return { entry, score };
  }).filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score || a.entry.code.localeCompare(b.entry.code));

  return scored.slice(0, limit).map(({ entry }) => ({
    code: entry.code,
    name: entry.name,
    levelName: entry.level,
    pathKo: entry.name,
    levelNumber: entry.code.length <= 1 ? 1 : entry.code.length <= 2 ? 2 : 5,
    childCount: 0,
  }));
}

function lookupKsicSeed(code: string): KsicEntry | null {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const exact = SEED.find((e) => normalizeCode(e.code) === normalized);
  if (exact) {
    return {
      code: exact.code,
      name: exact.name,
      levelName: exact.level,
      pathKo: exact.name,
      levelNumber: exact.code.length <= 1 ? 1 : 2,
      childCount: 0,
    };
  }

  const prefixMatches = SEED.filter((e) => normalized.startsWith(normalizeCode(e.code)));
  if (prefixMatches.length === 0) return null;
  const best = prefixMatches.sort((a, b) => b.code.length - a.code.length)[0];
  return {
    code: best.code,
    name: best.name,
    levelName: best.level,
    pathKo: best.name,
    levelNumber: 2,
    childCount: 0,
  };
}

function listKsicChildrenSeed(parentCode: string | null): KsicEntry[] {
  if (parentCode === null) {
    return SEED.filter((e) => e.level === "section")
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((entry) => ({
        code: entry.code,
        name: entry.name,
        levelName: "대분류",
        pathKo: entry.name,
        levelNumber: 1,
        childCount: SEED.some((c) => c.section === entry.code) ? 1 : 0,
      }));
  }

  const parent = normalizeCode(parentCode);
  return SEED.filter((e) => e.section === parent && e.level === "division")
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((entry) => ({
      code: entry.code,
      name: entry.name,
      levelName: "중분류",
      pathKo: entry.name,
      levelNumber: 2,
      childCount: 0,
    }));
}

export async function listKsicChildrenDb(parentCode: string | null): Promise<KsicEntry[]> {
  if (!(await isKsicDbReady())) {
    return listKsicChildrenSeed(parentCode);
  }

  const admin = createSupabaseServiceRoleClient();
  let builder = admin
    .from("ksic_codes")
    .select(
      "code, name_ko, level_name, path_ko, level_number, child_count, major_code_range",
    )
    .eq("revision", KSIC_REVISION)
    .order("code");

  if (parentCode === null || parentCode.trim() === "") {
    builder = builder.eq("level_number", 1);
  } else {
    builder = builder.eq("parent_code", parentCode.trim());
  }

  const { data, error } = await builder;
  if (error || !data?.length) {
    return listKsicChildrenSeed(parentCode);
  }

  return (data as CodeRow[]).map(mapRow);
}

export async function searchKsicDb(query: string, limit = 15): Promise<KsicEntry[]> {
  if (!(await isKsicDbReady())) {
    return searchKsicSeed(query, limit);
  }

  const q = query.trim();
  if (!q) return [];

  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeCode(q);
  const isCodeLike = /^[A-Sa-s0-9]+$/.test(normalized);

  let builder = admin
    .from("ksic_codes")
    .select("code, name_ko, level_name, path_ko, level_number")
    .eq("revision", KSIC_REVISION);

  if (isCodeLike && normalized.length > 0) {
    builder = builder.or(`code.eq.${normalized},code.ilike.${normalized}%`);
  } else {
    const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    builder = builder.ilike("name_ko", `%${escaped}%`);
  }

  const { data, error } = await builder
    .order("level_number", { ascending: false })
    .order("code")
    .limit(Math.max(limit * 4, 40));

  if (error || !data?.length) {
    return searchKsicSeed(query, limit);
  }

  const lower = q.toLowerCase();
  const scored = (data as CodeRow[])
    .map((row) => {
      let score = 0;
      if (row.code === normalized) score += 100;
      else if (row.code.startsWith(normalized) || normalized.startsWith(row.code)) score += 60;
      if (row.name_ko.toLowerCase().includes(lower)) score += 40;
      if (row.name_ko.toLowerCase().startsWith(lower)) score += 20;
      if (row.level_number === 5) score += 10;
      return { row, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score || a.row.code.localeCompare(b.row.code));

  const seen = new Set<string>();
  const results: KsicEntry[] = [];
  for (const { row } of scored) {
    if (seen.has(row.code)) continue;
    seen.add(row.code);
    results.push(mapRow(row));
    if (results.length >= limit) break;
  }
  return results;
}

function parseListField(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function getKsicDetailDb(code: string): Promise<KsicDetailPreview | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  if (!(await isKsicDbReady())) {
    const entry = lookupKsicSeed(trimmed);
    if (!entry) return null;
    return {
      entry,
      revision: KSIC_REVISION,
      nameEn: "",
      definition: "",
      examples: [],
      exclusions: [],
    };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: row, error } = await admin
    .from("ksic_codes")
    .select(
      "code, name_ko, name_en, level_name, path_ko, level_number, child_count, major_code_range, definition, examples, exclusions",
    )
    .eq("revision", KSIC_REVISION)
    .eq("code", trimmed)
    .maybeSingle();

  if (error || !row) {
    const entry = lookupKsicSeed(trimmed);
    if (!entry) return null;
    return {
      entry,
      revision: KSIC_REVISION,
      nameEn: "",
      definition: "",
      examples: [],
      exclusions: [],
    };
  }

  const entry = mapRow(row as CodeRow);
  const preview: KsicDetailPreview = {
    entry,
    revision: KSIC_REVISION,
    nameEn: (row as CodeRow).name_en?.trim() ?? "",
    definition: (row as CodeRow).definition?.trim() ?? "",
    examples: parseListField((row as CodeRow).examples ?? ""),
    exclusions: parseListField((row as CodeRow).exclusions ?? ""),
  };

  if (entry.levelNumber === 5) {
    const { data: detail } = await admin
      .from("ksic_detail_ai")
      .select("ai_context_for_survey, detail_definition, detail_examples, detail_exclusions")
      .eq("revision", KSIC_REVISION)
      .eq("detail_code", trimmed)
      .maybeSingle();

    if (detail) {
      if (detail.ai_context_for_survey?.trim()) {
        preview.aiContextForSurvey = detail.ai_context_for_survey.trim();
      }
      if (!preview.definition && detail.detail_definition?.trim()) {
        preview.definition = detail.detail_definition.trim();
      }
      if (preview.examples.length === 0 && detail.detail_examples?.trim()) {
        preview.examples = parseListField(detail.detail_examples);
      }
      if (preview.exclusions.length === 0 && detail.detail_exclusions?.trim()) {
        preview.exclusions = parseListField(detail.detail_exclusions);
      }
    }
  }

  return preview;
}

export async function lookupKsicDb(code: string): Promise<KsicEntry | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  if (!(await isKsicDbReady())) {
    return lookupKsicSeed(trimmed);
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("ksic_codes")
    .select("code, name_ko, level_name, path_ko, level_number")
    .eq("revision", KSIC_REVISION)
    .eq("code", trimmed)
    .maybeSingle();

  if (error || !data) {
    return lookupKsicSeed(trimmed);
  }

  return mapRow(data as CodeRow);
}

export async function formatKsicContextDb(code: string, name: string): Promise<string> {
  const trimmedCode = code.trim();
  const displayName = name.trim();

  if (!(await isKsicDbReady())) {
    const lookup = lookupKsicSeed(trimmedCode);
    const n = displayName || lookup?.name || "(명칭 미입력)";
    return [
      `KSIC 코드: ${trimmedCode}`,
      `산업 명칭: ${n}`,
      "참고: KSIC DB가 비어 있어 내장 샘플만 사용 중입니다. `npm run db:import-ksic` 실행을 권장합니다.",
    ].join("\n");
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: detail } = await admin
    .from("ksic_detail_ai")
    .select("ai_context_for_survey, detail_name_ko")
    .eq("revision", KSIC_REVISION)
    .eq("detail_code", trimmedCode)
    .maybeSingle();

  if (detail?.ai_context_for_survey?.trim()) {
    const title = displayName || detail.detail_name_ko;
    if (title && !detail.ai_context_for_survey.includes(title)) {
      return `${detail.ai_context_for_survey}\n\n[관리자 입력 명칭: ${title}]`;
    }
    return detail.ai_context_for_survey.trim();
  }

  const { data: row } = await admin
    .from("ksic_codes")
    .select("name_ko, path_ko, level_name, definition, ai_context")
    .eq("revision", KSIC_REVISION)
    .eq("code", trimmedCode)
    .maybeSingle();

  if (row) {
    const n = displayName || row.name_ko;
    const lines = [
      `KSIC 코드: ${trimmedCode}`,
      `산업 명칭: ${n}`,
      `분류 수준: ${row.level_name}`,
      `경로: ${row.path_ko}`,
    ];
    if (row.definition?.trim()) lines.push(`설명: ${row.definition.trim()}`);
    if (row.ai_context?.trim()) lines.push("", row.ai_context.trim());
    return lines.join("\n");
  }

  return [
    `KSIC 코드: ${trimmedCode}`,
    `산업 명칭: ${displayName || "(명칭 미입력)"}`,
    "참고: DB에 해당 코드가 없습니다. 입력값을 기준으로 설문을 설계합니다.",
  ].join("\n");
}
