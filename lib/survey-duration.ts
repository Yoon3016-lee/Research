export const SURVEY_DURATION_MAX_SECONDS = 24 * 60 * 60;

export type DurationBucket = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type DurationSummary = {
  measuredCount: number;
  missingCount: number;
  minSeconds: number | null;
  maxSeconds: number | null;
  meanSeconds: number | null;
  medianSeconds: number | null;
  buckets: DurationBucket[];
};

const BUCKET_DEFS: { key: string; label: string; maxExclusive: number }[] = [
  { key: "lt1", label: "1분 미만", maxExclusive: 60 },
  { key: "1to3", label: "1–3분", maxExclusive: 180 },
  { key: "3to5", label: "3–5분", maxExclusive: 300 },
  { key: "5to10", label: "5–10분", maxExclusive: 600 },
  { key: "10to20", label: "10–20분", maxExclusive: 1200 },
  { key: "20to60", label: "20–60분", maxExclusive: 3600 },
  { key: "gte60", label: "1시간 이상", maxExclusive: Number.POSITIVE_INFINITY },
];

export function surveyStartedAtStorageKey(slug: string, sessionKey: string): string {
  return `survey-timer:${slug}:${sessionKey}`;
}

export type SurveyTimerState = {
  startedAt: string;
  activeSeconds: number;
};

function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function earliestIso(...candidates: (string | null | undefined)[]): string | null {
  const times = candidates
    .filter(isValidIsoDate)
    .map((v) => ({ v, t: new Date(v).getTime() }))
    .sort((a, b) => a.t - b.t);
  return times[0]?.v ?? null;
}

function parseStoredTimer(raw: string | null): SurveyTimerState | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { startedAt?: string; activeSeconds?: number };
    if (!isValidIsoDate(parsed.startedAt)) return null;
    const activeSeconds =
      typeof parsed.activeSeconds === "number" && Number.isFinite(parsed.activeSeconds)
        ? Math.max(0, parsed.activeSeconds)
        : 0;
    return { startedAt: parsed.startedAt, activeSeconds };
  } catch {
    if (isValidIsoDate(raw)) {
      return { startedAt: raw, activeSeconds: 0 };
    }
    return null;
  }
}

function getTimerStore(persistent: boolean): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return persistent ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

export function readOrCreateSurveyTimer(
  storageKey: string,
  options?: {
    persistent?: boolean;
    seedStartedAt?: string | null;
    seedActiveSeconds?: number | null;
  },
): SurveyTimerState {
  const persistent = options?.persistent ?? false;
  const seedSeconds =
    typeof options?.seedActiveSeconds === "number" && Number.isFinite(options.seedActiveSeconds)
      ? Math.max(0, options.seedActiveSeconds)
      : 0;
  const store = getTimerStore(persistent);
  const stored =
    parseStoredTimer(store?.getItem(storageKey) ?? null) ??
    parseStoredTimer(
      store?.getItem(storageKey.replace("survey-timer:", "survey-started-at:")) ?? null,
    );
  const startedAt =
    earliestIso(options?.seedStartedAt, stored?.startedAt) ?? new Date().toISOString();
  const activeSeconds = Math.max(seedSeconds, stored?.activeSeconds ?? 0);
  const state = { startedAt, activeSeconds };
  try {
    store?.setItem(storageKey, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  return state;
}

/** @deprecated 열린 시간 누적 타이머로 대체 */
export function readOrCreateSurveyStartedAt(
  storageKey: string,
  options?: { persistent?: boolean; seed?: string | null },
): string {
  return readOrCreateSurveyTimer(storageKey, {
    persistent: options?.persistent,
    seedStartedAt: options?.seed,
  }).startedAt;
}

export function persistSurveyTimer(
  storageKey: string,
  state: SurveyTimerState,
  persistent: boolean,
): void {
  try {
    getTimerStore(persistent)?.setItem(storageKey, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clearSurveyStartedAt(
  storageKey: string,
  options?: { persistent?: boolean },
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey.replace("survey-timer:", "survey-started-at:"));
    if (options?.persistent) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(storageKey.replace("survey-timer:", "survey-started-at:"));
    }
  } catch {
    /* ignore */
  }
}

export function resolveSurveyDuration(
  params: {
    startedAt?: string;
    activeSeconds?: number;
  },
  submittedAt: Date = new Date(),
): { startedAt: string | null; durationSeconds: number | null } {
  const startedAtRaw = params.startedAt;
  if (!startedAtRaw?.trim()) {
    return { startedAt: null, durationSeconds: null };
  }
  const started = new Date(startedAtRaw);
  if (Number.isNaN(started.getTime())) {
    return { startedAt: null, durationSeconds: null };
  }
  const skewMs = 2 * 60 * 1000;
  if (started.getTime() > submittedAt.getTime() + skewMs) {
    return { startedAt: null, durationSeconds: null };
  }
  const wallSeconds = Math.max(
    0,
    Math.round((submittedAt.getTime() - started.getTime()) / 1000),
  );
  const reported =
    typeof params.activeSeconds === "number" && Number.isFinite(params.activeSeconds)
      ? Math.max(0, Math.round(params.activeSeconds))
      : null;
  const durationSeconds = Math.min(
    reported ?? wallSeconds,
    wallSeconds + 60,
    SURVEY_DURATION_MAX_SECONDS,
  );
  return {
    startedAt: started.toISOString(),
    durationSeconds,
  };
}

export function formatDurationSeconds(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const s = Math.round(seconds);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m < 60) return remS ? `${m}분 ${remS}초` : `${m}분`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM ? `${h}시간 ${remM}분` : `${h}시간`;
}

function pct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sorted[mid]!;
  return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function emptyDurationSummary(totalSubmissions: number): DurationSummary {
  return {
    measuredCount: 0,
    missingCount: totalSubmissions,
    minSeconds: null,
    maxSeconds: null,
    meanSeconds: null,
    medianSeconds: null,
    buckets: BUCKET_DEFS.map((b) => ({
      key: b.key,
      label: b.label,
      count: 0,
      percent: 0,
    })),
  };
}

export function summarizeDurations(
  secondsList: number[],
  totalSubmissions: number,
): DurationSummary {
  const measured = secondsList.filter((s) => Number.isFinite(s) && s >= 0);
  const sorted = [...measured].sort((a, b) => a - b);
  const counts = new Map<string, number>();
  for (const def of BUCKET_DEFS) counts.set(def.key, 0);
  for (const s of measured) {
    const def = BUCKET_DEFS.find((b) => s < b.maxExclusive) ?? BUCKET_DEFS[BUCKET_DEFS.length - 1]!;
    counts.set(def.key, (counts.get(def.key) ?? 0) + 1);
  }
  const n = measured.length;
  const sum = measured.reduce((acc, s) => acc + s, 0);
  return {
    measuredCount: n,
    missingCount: Math.max(0, totalSubmissions - n),
    minSeconds: n > 0 ? sorted[0]! : null,
    maxSeconds: n > 0 ? sorted[n - 1]! : null,
    meanSeconds: n > 0 ? Math.round(sum / n) : null,
    medianSeconds: n > 0 ? median(sorted) : null,
    buckets: BUCKET_DEFS.map((b) => {
      const count = counts.get(b.key) ?? 0;
      return {
        key: b.key,
        label: b.label,
        count,
        percent: pct(count, n),
      };
    }),
  };
}
