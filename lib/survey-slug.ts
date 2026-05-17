/** URL 경로·쿼리에서 넘어온 설문 slug/ref 정규화 (이중 인코딩 대비) */
export function normalizeSurveyRef(ref: string): string {
  let s = ref.trim();
  if (!s) return "";

  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(s);
      if (decoded === s) break;
      s = decoded;
    } catch {
      break;
    }
  }

  return s;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
