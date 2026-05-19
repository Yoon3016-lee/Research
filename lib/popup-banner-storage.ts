const SNOOZE_IDS_KEY = "research-popup-banner-snooze-ids";
const DISMISSED_IDS_KEY = "research-popup-banner-dismissed-ids";

export function getTodayLocalDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getSnoozedIdsForToday(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SNOOZE_IDS_KEY);
    const parsed = readJson<{ date: string; ids: string[] }>(raw, {
      date: "",
      ids: [],
    });
    if (parsed.date !== getTodayLocalDateKey()) return new Set();
    return new Set(parsed.ids);
  } catch {
    return new Set();
  }
}

export function snoozePopupBannerIdForToday(bannerId: string): void {
  try {
    const today = getTodayLocalDateKey();
    const ids = getSnoozedIdsForToday();
    ids.add(bannerId);
    localStorage.setItem(
      SNOOZE_IDS_KEY,
      JSON.stringify({ date: today, ids: [...ids] }),
    );
  } catch {
    /* ignore */
  }
}

function getSessionDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const ids = readJson<string[]>(sessionStorage.getItem(DISMISSED_IDS_KEY), []);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export function dismissPopupBannerIdForSession(bannerId: string): void {
  try {
    const ids = getSessionDismissedIds();
    ids.add(bannerId);
    sessionStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function isPopupBannerVisible(bannerId: string): boolean {
  if (getSnoozedIdsForToday().has(bannerId)) return false;
  if (getSessionDismissedIds().has(bannerId)) return false;
  return true;
}

export function filterVisiblePopupBanners<T extends { id: string }>(banners: T[]): T[] {
  return banners.filter((b) => isPopupBannerVisible(b.id));
}
