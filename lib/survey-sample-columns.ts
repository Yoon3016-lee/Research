/** Excel 열 문자 ↔ 0-based 인덱스 (A=0, Z=25, AA=26, ZZ=701) */

const MAX_COLUMN_INDEX = 701;

export function columnIndexToLetter(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index > MAX_COLUMN_INDEX) {
    throw new RangeError(`열 인덱스가 범위를 벗어났습니다: ${index}`);
  }
  let n = index + 1;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

export function columnLetterToIndex(letter: string): number {
  const normalized = letter.trim().toUpperCase();
  if (!/^[A-Z]{1,2}$/.test(normalized)) {
    return -1;
  }
  let index = 0;
  for (let i = 0; i < normalized.length; i++) {
    index = index * 26 + (normalized.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function isValidColumnLetter(letter: string): boolean {
  const index = columnLetterToIndex(letter);
  return index >= 0 && index <= MAX_COLUMN_INDEX;
}

export function formatColumnLabel(letter: string, headerLabel?: string): string {
  if (headerLabel?.trim()) {
    return `${letter} (${headerLabel.trim()})`;
  }
  return letter;
}

export function buildColumnLetters(count: number): string[] {
  const safe = Math.max(1, Math.min(count, MAX_COLUMN_INDEX + 1));
  return Array.from({ length: safe }, (_, index) => columnIndexToLetter(index));
}
