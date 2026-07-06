import type { KsicEntry } from "@/lib/ksic-types";

/** 계층 탐색 목록 한 줄 라벨 */
export function formatKsicHierarchyLabel(entry: KsicEntry): string {
  if (entry.levelNumber === 1 && entry.majorCodeRange) {
    return `${entry.code} ${entry.name} (${entry.majorCodeRange})`;
  }
  return `${entry.code} ${entry.name}`;
}
