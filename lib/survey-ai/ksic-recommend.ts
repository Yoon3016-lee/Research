import "server-only";

import {
  getKsicDetail,
  lookupKsic,
  searchKsic,
  type KsicEntry,
} from "@/lib/survey-ai/ksic";
import {
  completeSurveyAiJson,
  resolveSurveyAiLlm,
} from "@/lib/survey-ai/llm";
import { parseAiResponseJson } from "@/lib/survey-ai/parse";
import type {
  KsicRecommendCandidate,
  KsicRecommendResult,
} from "@/lib/survey-ai/ksic-recommend-types";

export type { KsicRecommendCandidate, KsicRecommendResult } from "@/lib/survey-ai/ksic-recommend-types";

export const KSIC_RECOMMEND_MIN_CHARS = 10;
export const KSIC_RECOMMEND_MAX_CHARS = 2000;
export const KSIC_RECOMMEND_TOP_N = 5;

type LlmQueryPayload = {
  queries?: unknown;
  keywords?: unknown;
  guessedNames?: unknown;
  guessedCodes?: unknown;
};

type ScoredCandidate = {
  entry: KsicEntry;
  score: number;
  hitQueries: string[];
};

function asStringList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim().replace(/\s+/g, " ");
    if (trimmed.length < 2 || trimmed.length > 80) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

function buildQueryHypothesesSystemPrompt(): string {
  return [
    "당신은 한국표준산업분류(KSIC) 검색 보조 도구입니다.",
    "사용자가 준 비정형 사업·업종 설명을 읽고, KSIC DB 키워드 검색에 쓸 짧은 검색어만 제안하세요.",
    "반드시 JSON 객체만 반환하세요.",
    "스키마:",
    '{ "queries": string[], "keywords": string[], "guessedNames": string[], "guessedCodes": string[] }',
    "- queries: DB 검색용 한글 검색어 3~8개 (업종명, 품목, 활동 동사 구 등). 코드 형식은 넣지 마세요.",
    "- keywords: 핵심 키워드 3~10개",
    "- guessedNames: 추정 산업 명칭(있을 때만)",
    "- guessedCodes: 추정 KSIC 코드(있을 때만, 확정 금지·힌트만)",
    "없는 KSIC 코드를 지어내지 마세요. 확신이 없으면 guessedCodes는 빈 배열로 두세요.",
  ].join("\n");
}

function buildRationale(params: {
  entry: KsicEntry;
  hitQueries: string[];
  definition?: string;
}): string {
  const { entry, hitQueries, definition } = params;
  const parts: string[] = [];
  if (hitQueries.length > 0) {
    parts.push(`검색어「${hitQueries.slice(0, 3).join(", ")}」와 매칭`);
  }
  if (entry.matchedExample) {
    parts.push(`포함 예시: ${entry.matchedExample}`);
  }
  if (definition?.trim()) {
    const short = definition.trim().replace(/\s+/g, " ").slice(0, 80);
    parts.push(`정의 요지: ${short}${definition.trim().length > 80 ? "…" : ""}`);
  }
  if (parts.length === 0) {
    parts.push(`${entry.levelName} 「${entry.name}」이(가) 입력 내용과 관련될 수 있습니다.`);
  }
  return parts.join(" · ");
}

async function extractSearchHypotheses(text: string): Promise<{
  queries: string[];
  guessedCodes: string[];
} | { error: string }> {
  const llm = resolveSurveyAiLlm();
  if ("error" in llm) return { error: llm.error };

  let raw: string;
  try {
    raw = await completeSurveyAiJson({
      config: llm,
      systemPrompt: buildQueryHypothesesSystemPrompt(),
      userPrompt: `비정형 설명:\n${text}`,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "검색어 생성 중 AI 오류가 발생했습니다.",
    };
  }

  let parsed: LlmQueryPayload;
  try {
    parsed = parseAiResponseJson(raw) as LlmQueryPayload;
  } catch {
    return { error: "AI가 검색어 JSON을 올바르게 반환하지 않았습니다." };
  }

  const queries = [
    ...asStringList(parsed.queries, 8),
    ...asStringList(parsed.keywords, 8),
    ...asStringList(parsed.guessedNames, 5),
  ];
  const uniqueQueries: string[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueQueries.push(q);
    if (uniqueQueries.length >= 10) break;
  }

  if (uniqueQueries.length === 0) {
    // LLM이 비어도 원문에서 짧게 잘라 한 번 검색 시도
    const fallback = text.slice(0, 40).trim();
    if (fallback.length >= KSIC_RECOMMEND_MIN_CHARS) uniqueQueries.push(fallback);
  }

  return {
    queries: uniqueQueries,
    guessedCodes: asStringList(parsed.guessedCodes, 5),
  };
}

function preferDetailLevel(a: ScoredCandidate, b: ScoredCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  // 세세분류(level 5) 우선, 그다음 코드 길이
  const levelDiff = (b.entry.levelNumber ?? 0) - (a.entry.levelNumber ?? 0);
  if (levelDiff !== 0) return levelDiff;
  return b.entry.code.length - a.entry.code.length ||
    a.entry.code.localeCompare(b.entry.code);
}

export async function recommendKsicFromUnstructured(
  rawText: string,
): Promise<KsicRecommendResult> {
  const text = rawText.trim().replace(/\s+/g, " ");
  if (text.length < KSIC_RECOMMEND_MIN_CHARS) {
    return {
      status: "error",
      error: `비정형 설명을 ${KSIC_RECOMMEND_MIN_CHARS}자 이상 입력해 주세요.`,
    };
  }
  if (text.length > KSIC_RECOMMEND_MAX_CHARS) {
    return {
      status: "error",
      error: `비정형 설명은 ${KSIC_RECOMMEND_MAX_CHARS}자 이하로 입력해 주세요.`,
    };
  }

  const hypotheses = await extractSearchHypotheses(text);
  if ("error" in hypotheses) {
    return { status: "error", error: hypotheses.error };
  }

  const { queries, guessedCodes } = hypotheses;
  const merged = new Map<string, ScoredCandidate>();

  // 힌트 코드는 lookup으로 존재 확인할 때만 채택
  for (const code of guessedCodes) {
    const found = await lookupKsic(code);
    if (!found) continue;
    const prev = merged.get(found.code);
    const score = 120 + found.code.length;
    if (!prev || score > prev.score) {
      merged.set(found.code, {
        entry: found,
        score,
        hitQueries: prev?.hitQueries ?? [`코드힌트 ${found.code}`],
      });
    }
  }

  for (const query of queries) {
    const hits = await searchKsic(query);
    hits.forEach((entry, index) => {
      const base = Math.max(10, 80 - index * 5);
      const detailBoost = entry.levelNumber >= 5 ? 15 : entry.levelNumber >= 4 ? 8 : 0;
      const exampleBoost = entry.matchedExample ? 12 : 0;
      const add = base + detailBoost + exampleBoost;
      const prev = merged.get(entry.code);
      if (!prev) {
        merged.set(entry.code, {
          entry,
          score: add,
          hitQueries: [query],
        });
        return;
      }
      const hitQueries = prev.hitQueries.includes(query)
        ? prev.hitQueries
        : [...prev.hitQueries, query].slice(0, 5);
      const nextEntry =
        !prev.entry.matchedExample && entry.matchedExample
          ? { ...prev.entry, matchedExample: entry.matchedExample }
          : prev.entry;
      merged.set(entry.code, {
        entry: nextEntry,
        score: prev.score + add * 0.55,
        hitQueries,
      });
    });
  }

  const ranked = [...merged.values()].sort(preferDetailLevel).slice(0, KSIC_RECOMMEND_TOP_N);
  if (ranked.length === 0) {
    return {
      status: "empty",
      message:
        "관련 KSIC 후보를 찾지 못했습니다. 설명을 구체화하거나 기존 검색·분류표로 선택해 주세요.",
      queriesUsed: queries,
    };
  }

  const candidates: KsicRecommendCandidate[] = [];
  for (const item of ranked) {
    const detail = await getKsicDetail(item.entry.code);
    candidates.push({
      code: item.entry.code,
      name: item.entry.name,
      levelName: item.entry.levelName,
      pathKo: item.entry.pathKo,
      matchedExample: item.entry.matchedExample,
      definition: detail?.definition?.trim() || undefined,
      examples: detail?.examples?.length ? detail.examples : undefined,
      rationale: buildRationale({
        entry: item.entry,
        hitQueries: item.hitQueries.filter((q) => !q.startsWith("코드힌트")),
        definition: detail?.definition,
      }),
    });
  }

  return { status: "ok", candidates, queriesUsed: queries };
}
