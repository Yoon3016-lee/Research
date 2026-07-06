/**
 * 공공데이터포털 · 한국무역보험공사_업종등급목록
 * https://www.data.go.kr/data/15144476/openapi.do
 */

export const KSURE_INDUSTRY_LEVEL_URL =
  "https://apis.data.go.kr/B552696/industryLevel/getIndustryLevelList";

export const KSURE_SOURCE = "ksure_industry_level";
export const KSIC_REVISION = 11;

const CODE_KEYS = ["industryCd", "indutyCd", "industryCode", "ksicCd", "code"];
const NAME_KEYS = ["industryNm", "indutyNm", "industryName", "nameKo", "name"];
const PARENT_KEYS = ["upIndustryCd", "upperIndustryCd", "parentIndustryCd", "parentCode"];
const LEVEL_KEYS = ["industryLevel", "indutyLevel", "level"];

export function readDataGoKrServiceKey() {
  return (
    process.env.DATA_GO_KR_SERVICE_KEY?.trim() ||
    process.env.PUBLIC_DATA_PORTAL_SERVICE_KEY?.trim() ||
    ""
  );
}

function pickField(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  for (const key of keys) {
    const val = obj[key];
    if (val == null) continue;
    const s = String(val).trim();
    if (s) return s;
  }
  return "";
}

function normalizeCode(code) {
  return code.trim().toUpperCase().replace(/\s/g, "");
}

export function mapKsureItem(raw, queryIndustryLevel) {
  const code = normalizeCode(pickField(raw, CODE_KEYS));
  if (!code) return null;
  const levelRaw = pickField(raw, LEVEL_KEYS) || String(queryIndustryLevel ?? "");
  const industryLevel = Number.parseInt(levelRaw, 10);
  return {
    code,
    nameKo: pickField(raw, NAME_KEYS),
    industryLevel: Number.isFinite(industryLevel) ? industryLevel : null,
    parentCode: normalizeCode(pickField(raw, PARENT_KEYS)) || null,
    raw,
  };
}

export function extractItems(json) {
  const root = json?.response ?? json;
  const header = root?.header ?? json?.header;
  const body = root?.body ?? json?.body ?? root;

  const resultCode = String(header?.resultCode ?? body?.resultCode ?? "").trim();
  const resultMsg = String(header?.resultMsg ?? body?.resultMsg ?? "").trim();

  if (resultCode && resultCode !== "00" && resultCode !== "0") {
    throw new Error(`API 오류 (${resultCode}): ${resultMsg || "알 수 없음"}`);
  }

  const itemsNode = body?.items?.item ?? body?.item ?? body?.items ?? [];
  const items = Array.isArray(itemsNode) ? itemsNode : itemsNode ? [itemsNode] : [];

  const totalCount = Number.parseInt(
    String(body?.totalCount ?? body?.totalcount ?? items.length),
    10,
  );

  return {
    items,
    totalCount: Number.isFinite(totalCount) ? totalCount : items.length,
    pageNo: Number.parseInt(String(body?.pageNo ?? 1), 10) || 1,
    numOfRows: Number.parseInt(String(body?.numOfRows ?? items.length), 10) || items.length,
  };
}

export async function fetchIndustryLevelPage({
  serviceKey,
  industryLevel,
  industryCd,
  pageNo = 1,
  numOfRows = 1000,
}) {
  const url = new URL(KSURE_INDUSTRY_LEVEL_URL);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("industryLevel", String(industryLevel));
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(numOfRows));
  url.searchParams.set("type", "json");
  if (industryCd) url.searchParams.set("industryCd", industryCd);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`JSON 파싱 실패: ${text.slice(0, 200)}`);
  }

  return extractItems(json);
}

export async function fetchAllKsureIndustryCodes(serviceKey, { onProgress } = {}) {
  const byCode = new Map();
  let apiCalls = 0;
  const numOfRows = 1000;

  for (let industryLevel = 1; industryLevel <= 4; industryLevel += 1) {
    let pageNo = 1;
    let totalCount = Infinity;

    while ((pageNo - 1) * numOfRows < totalCount) {
      const page = await fetchIndustryLevelPage({
        serviceKey,
        industryLevel,
        pageNo,
        numOfRows,
      });
      apiCalls += 1;

      totalCount = page.totalCount;
      for (const raw of page.items) {
        const mapped = mapKsureItem(raw, industryLevel);
        if (!mapped) continue;
        const prev = byCode.get(mapped.code);
        if (!prev) {
          byCode.set(mapped.code, mapped);
        } else if (!prev.nameKo && mapped.nameKo) {
          byCode.set(mapped.code, { ...prev, nameKo: mapped.nameKo });
        }
      }

      onProgress?.({
        industryLevel,
        pageNo,
        fetched: byCode.size,
        apiCalls,
        pageItems: page.items.length,
      });

      if (page.items.length === 0) break;
      if (page.items.length < numOfRows) break;
      pageNo += 1;
    }
  }

  return {
    records: [...byCode.values()],
    apiCalls,
  };
}
