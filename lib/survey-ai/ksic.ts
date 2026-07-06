import ksicSeed from "@/data/ksic-seed.json";

export type KsicEntry = {
  code: string;
  name: string;
  level: "section" | "division" | "class";
  section?: string;
};

const ENTRIES = ksicSeed as KsicEntry[];

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s/g, "");
}

export function lookupKsic(code: string): KsicEntry | null {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const exact = ENTRIES.find((e) => normalizeCode(e.code) === normalized);
  if (exact) return exact;

  const prefixMatches = ENTRIES.filter((e) => normalized.startsWith(normalizeCode(e.code)));
  if (prefixMatches.length === 0) return null;

  return prefixMatches.sort((a, b) => b.code.length - a.code.length)[0] ?? null;
}

export function searchKsic(query: string, limit = 15): KsicEntry[] {
  const q = query.trim();
  if (!q) return [];

  const lower = q.toLowerCase();
  const normalizedCode = normalizeCode(q);

  const scored = ENTRIES.map((entry) => {
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

  const seen = new Set<string>();
  const results: KsicEntry[] = [];
  for (const { entry } of scored) {
    if (seen.has(entry.code)) continue;
    seen.add(entry.code);
    results.push(entry);
    if (results.length >= limit) break;
  }
  return results;
}

export function formatKsicContext(code: string, name: string): string {
  const lookup = lookupKsic(code);
  const displayName = name.trim() || lookup?.name || "(명칭 미입력)";
  const lines = [`KSIC 코드: ${code.trim()}`, `산업 명칭: ${displayName}`];
  if (lookup) {
    lines.push(`분류 수준: ${lookup.level}`);
    if (lookup.section) {
      const section = ENTRIES.find((e) => e.code === lookup.section);
      if (section) lines.push(`대분류: ${section.code} ${section.name}`);
    }
  } else {
    lines.push(
      "참고: 내장 KSIC 목록에 정확히 일치하는 코드가 없습니다. 입력하신 코드·명칭을 기준으로 설문을 설계합니다.",
    );
  }
  return lines.join("\n");
}
