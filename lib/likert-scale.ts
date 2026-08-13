/** 리커트 척도 공통 설정 */

export const DEFAULT_LIKERT_SCALE_SIZE = 5;
export const MIN_LIKERT_SCALE_SIZE = 2;
export const MAX_LIKERT_SCALE_SIZE = 10;

export function clampLikertScaleSize(size: number | null | undefined): number {
  const n =
    typeof size === "number" && Number.isFinite(size)
      ? Math.round(size)
      : DEFAULT_LIKERT_SCALE_SIZE;
  return Math.min(MAX_LIKERT_SCALE_SIZE, Math.max(MIN_LIKERT_SCALE_SIZE, n));
}

export function likertScaleValues(scaleSize: number): number[] {
  const size = clampLikertScaleSize(scaleSize);
  return Array.from({ length: size }, (_, i) => i + 1);
}

export function isLikertScaleValue(value: number, scaleSize: number): boolean {
  const size = clampLikertScaleSize(scaleSize);
  return Number.isInteger(value) && value >= 1 && value <= size;
}

export function emptyLikertScaleLabels(scaleSize: number): string[] {
  return Array.from({ length: clampLikertScaleSize(scaleSize) }, () => "");
}

export function normalizeLikertScaleLabels(
  labels: string[] | null | undefined,
  scaleSize: number,
): string[] {
  const size = clampLikertScaleSize(scaleSize);
  const base = Array.isArray(labels) ? labels.map((l) => (typeof l === "string" ? l : "")) : [];
  if (base.length === size) return base;
  if (base.length > size) return base.slice(0, size);
  return [...base, ...emptyLikertScaleLabels(size - base.length)];
}

export function parseLikertScaleLabelsFromDb(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map((item) => (typeof item === "string" ? item : ""));
}

/** 구 likert_7: options 2개(1점·7점 라벨) → 점수별 배열 */
export function legacyLikertEndpointLabels(
  endpointLabels: string[],
  scaleSize: number,
): string[] {
  const size = clampLikertScaleSize(scaleSize);
  const labels = emptyLikertScaleLabels(size);
  const min = endpointLabels[0]?.trim() ?? "";
  const max = endpointLabels[1]?.trim() ?? "";
  if (min) labels[0] = min;
  if (max) labels[size - 1] = max;
  return labels;
}

export function likertValueFromClientX(
  clientX: number,
  track: HTMLElement | null,
  scaleSize: number,
): number | null {
  if (!track) return null;
  const rect = track.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const values = likertScaleValues(scaleSize);
  const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const n = Math.round(t * (values.length - 1)) + 1;
  return isLikertScaleValue(n, scaleSize) ? n : null;
}

/** 1→① … 20→⑳, 그 외는 (n) */
const CIRCLED_MARKS =
  "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

export function likertCircledMark(point: number): string {
  if (Number.isInteger(point) && point >= 1 && point <= 20) {
    return CIRCLED_MARKS.charAt(point - 1);
  }
  return `(${point})`;
}

/** 응답·헤더 표시: ① 라벨 (라벨 없으면 ①만) */
export function displayLikertPointLabel(
  pointIndex: number,
  scaleLabels: string[],
): string {
  const mark = likertCircledMark(pointIndex + 1);
  const custom = scaleLabels[pointIndex]?.trim();
  if (custom) return `${mark} ${custom}`;
  return mark;
}
