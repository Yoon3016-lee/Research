/** Asia/Seoul (UTC+9) 표시용. DB timestamptz는 UTC로 유지하고, 내보내기·화면에서만 변환합니다. */

const KST_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** ISO/timestamptz 문자열 → `YYYY-MM-DD HH:mm:ss` (한국시간) */
export function formatDateTimeKst(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return KST_FORMATTER.format(date).replace("T", " ");
}
