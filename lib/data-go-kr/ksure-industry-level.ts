/**
 * 공공데이터포털 · 한국무역보험공사_업종등급목록 (서버 런타임용 타입·상수)
 * API 호출·동기화는 `npm run db:sync-ksic-external` CLI 사용.
 * @see scripts/lib/data-go-kr-ksure.mjs
 */

export const DATA_GO_KR_KSURE_INDUSTRY_LEVEL_URL =
  "https://apis.data.go.kr/B552696/industryLevel/getIndustryLevelList";

export function readDataGoKrServiceKey(): string {
  return (
    process.env["DATA_GO_KR_SERVICE_KEY"]?.trim() ||
    process.env["PUBLIC_DATA_PORTAL_SERVICE_KEY"]?.trim() ||
    ""
  );
}
