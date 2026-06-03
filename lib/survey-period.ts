import type { SurveyStatus } from "@/lib/survey-list-types";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 로컬 날짜 기준 YYYY-MM-DD */
export function toDateOnlyString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysToDateOnly(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateOnlyString(date);
}

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}

/** 오늘(로컬) 기준 설문 상태 */
export function resolveSurveyStatus(
  periodStart: string,
  periodEnd: string,
  today: string = toDateOnlyString(),
): SurveyStatus {
  if (today < periodStart) return "예정";
  if (today > periodEnd) return "종료";
  return "진행중";
}

export function formatPeriodLabel(periodStart: string, periodEnd: string): string {
  const fmt = (iso: string) => iso.replace(/-/g, ".");
  return `${fmt(periodStart)} — ${fmt(periodEnd)}`;
}

export function validateSurveyPeriod(
  periodStart: string,
  periodEnd: string,
): string | null {
  const start = periodStart.trim();
  const end = periodEnd.trim();
  if (!start || !end) return "시작일과 종료일을 모두 선택하세요.";
  if (!isValidDateOnly(start) || !isValidDateOnly(end)) {
    return "날짜 형식이 올바르지 않습니다.";
  }
  if (start > end) return "종료일은 시작일과 같거나 이후여야 합니다.";
  return null;
}

export type SurveyPeriodPersist = {
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  status: SurveyStatus;
};

export function buildSurveyPeriodPersist(
  periodStart: string,
  periodEnd: string,
): { ok: true; data: SurveyPeriodPersist } | { ok: false; error: string } {
  const err = validateSurveyPeriod(periodStart, periodEnd);
  if (err) return { ok: false, error: err };
  const start = periodStart.trim();
  const end = periodEnd.trim();
  return {
    ok: true,
    data: {
      periodStart: start,
      periodEnd: end,
      periodLabel: formatPeriodLabel(start, end),
      status: resolveSurveyStatus(start, end),
    },
  };
}

/** DB date / text → YYYY-MM-DD (폼·비교용) */
export function normalizeStoredDate(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value).trim();
  if (DATE_ONLY_RE.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return toDateOnlyString(d);
}
