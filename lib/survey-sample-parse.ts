import * as XLSX from "xlsx";
import {
  buildColumnLetters,
  columnLetterToIndex,
  isValidColumnLetter,
} from "@/lib/survey-sample-columns";
import type {
  SurveySampleColumnInfo,
  SurveySampleColumnMapping,
  SurveySamplePreviewRow,
  SurveySampleSpreadsheetPreview,
  SurveySampleUploadWarnings,
} from "@/lib/survey-sample-types";
import { isValidEmailAddress } from "@/lib/survey-email-shared";
import type { ParticipationFormat } from "@/lib/survey-participation-format";

const MAX_PREVIEW_ROWS = 8;
const MAX_UPLOAD_ROWS = 50_000;

type Matrix = (string | number | boolean | Date | null)[][];

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
}

function readSpreadsheetMatrix(buffer: Buffer): Matrix {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("엑셀 파일에 시트가 없습니다.");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(
    sheet,
    { header: 1, defval: null, raw: false },
  );

  if (!matrix.length) {
    throw new Error("엑셀 파일이 비어 있습니다.");
  }

  return matrix;
}

function resolveColumnCount(matrix: Matrix): number {
  let max = 0;
  for (const row of matrix) {
    if ((row?.length ?? 0) > max) {
      max = row?.length ?? 0;
    }
  }
  return Math.max(max, 1);
}

function buildColumnInfos(matrix: Matrix): SurveySampleColumnInfo[] {
  const columnCount = resolveColumnCount(matrix);
  const letters = buildColumnLetters(columnCount);

  return letters.map((letter, index) => ({
    letter,
    index,
    headerLabel: "",
  }));
}

function buildRowCells(
  row: (string | number | boolean | Date | null)[] | undefined,
  columns: SurveySampleColumnInfo[],
): Record<string, string> {
  const cells: Record<string, string> = {};
  for (const col of columns) {
    cells[col.letter] = cellToString(row?.[col.index]);
  }
  return cells;
}

/** 시트의 모든 비어 있지 않은 행을 스캔 (헤더 행 구분 없음) */
function listScannedRows(matrix: Matrix): {
  rows: (string | number | boolean | Date | null)[][];
  excelRowIndexes: number[];
} {
  const rows: (string | number | boolean | Date | null)[][] = [];
  const excelRowIndexes: number[] = [];

  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    if (!(row ?? []).some((cell) => cellToString(cell).length > 0)) {
      continue;
    }
    rows.push(row ?? []);
    excelRowIndexes.push(i + 1);
  }

  return { rows, excelRowIndexes };
}

function assertSiteMapping(mapping: SurveySampleColumnMapping, columns: SurveySampleColumnInfo[]): void {
  if (!mapping.phoneColumn || !mapping.outcomeColumn) {
    throw new Error("UID·전화번호·결과 열을 모두 선택하세요.");
  }
  for (const [role, letter] of [
    ["UID", mapping.uidColumn],
    ["전화번호", mapping.phoneColumn],
    ["결과", mapping.outcomeColumn],
  ] as const) {
    if (!isValidColumnLetter(letter)) {
      throw new Error(`${role} 열(${letter})이 올바른 Excel 열 문자가 아닙니다. (예: A, G, J)`);
    }
    const index = columnLetterToIndex(letter);
    if (index >= columns.length) {
      throw new Error(`${role} 열 ${letter}은(는) 이 파일에 존재하지 않습니다.`);
    }
  }

  const letters = [mapping.uidColumn, mapping.phoneColumn, mapping.outcomeColumn];
  if (new Set(letters).size !== letters.length) {
    throw new Error("UID·전화번호·결과 열은 서로 다른 열이어야 합니다.");
  }
}

function assertEmailMapping(mapping: SurveySampleColumnMapping, columns: SurveySampleColumnInfo[]): void {
  if (!mapping.emailColumn) {
    throw new Error("UID·이메일 열을 모두 선택하세요.");
  }
  for (const [role, letter] of [
    ["UID", mapping.uidColumn],
    ["이메일", mapping.emailColumn],
  ] as const) {
    if (!isValidColumnLetter(letter)) {
      throw new Error(`${role} 열(${letter})이 올바른 Excel 열 문자가 아닙니다.`);
    }
    const index = columnLetterToIndex(letter);
    if (index >= columns.length) {
      throw new Error(`${role} 열 ${letter}은(는) 이 파일에 존재하지 않습니다.`);
    }
  }

  const letters = [mapping.uidColumn, mapping.emailColumn];
  if (mapping.nameColumn) {
    if (!isValidColumnLetter(mapping.nameColumn)) {
      throw new Error(`이름 열(${mapping.nameColumn})이 올바른 Excel 열 문자가 아닙니다.`);
    }
    letters.push(mapping.nameColumn);
  }
  if (new Set(letters).size !== letters.length) {
    throw new Error("UID·이메일·이름 열은 서로 달라야 합니다.");
  }
}

function assertMapping(
  mapping: SurveySampleColumnMapping,
  columns: SurveySampleColumnInfo[],
  format: ParticipationFormat,
): void {
  if (format === "email") {
    assertEmailMapping(mapping, columns);
  } else {
    assertSiteMapping(mapping, columns);
  }
}

function isHeaderLikeUid(uid: string): boolean {
  return /^uid$/i.test(uid.trim());
}

function shouldImportRow(uid: string): boolean {
  const trimmed = uid.trim();
  if (!trimmed) return false;
  if (isHeaderLikeUid(trimmed)) return false;
  return true;
}

/** 열 라벨 추정용 — UID 텍스트가 있는 행을 찾아 열 이름 힌트로만 사용 */
function findLabelRow(matrix: Matrix, uidColumnIndex: number): Matrix[number] | null {
  const scanLimit = Math.min(matrix.length, 40);
  for (let i = 0; i < scanLimit; i++) {
    const cell = cellToString(matrix[i]?.[uidColumnIndex]);
    if (/^uid$/i.test(cell)) {
      return matrix[i] ?? null;
    }
  }
  return null;
}

export function guessSurveySampleColumns(
  matrix: Matrix,
  columns: SurveySampleColumnInfo[],
  format: ParticipationFormat = "site",
): SurveySampleColumnMapping {
  const uidIndex = columnLetterToIndex("A");
  const labelRow = uidIndex >= 0 ? findLabelRow(matrix, uidIndex) : null;

  const find = (patterns: RegExp[], fallbackIndex: number) => {
    if (labelRow) {
      for (const col of columns) {
        const key = cellToString(labelRow[col.index]).toLowerCase().replace(/\s/g, "");
        if (key && patterns.some((p) => p.test(key))) {
          return col.letter;
        }
      }
    }
    return columns[fallbackIndex]?.letter ?? columns[0]?.letter ?? "A";
  };

  if (format === "email") {
    return {
      uidColumn: find([/^uid$/, /고유/, /식별/, /표본/, /id$/], 0),
      emailColumn: find([/email/, /이메일/, /메일/, /e-mail/], 1),
      nameColumn: find([/이름/, /성명/, /name/], 2),
    };
  }

  return {
    uidColumn: find([/^uid$/, /고유/, /식별/, /표본/, /id$/], 0),
    phoneColumn: find([/전화/, /휴대/, /연락/, /phone/, /mobile/, /tel/], 6),
    outcomeColumn: find([/결과/, /통화/, /상태/, /outcome/, /유형/, /성공/, /비고/, /메모/], 9),
  };
}

function countImportableRows(
  dataRows: Matrix,
  excelRowIndexes: number[],
  mapping: SurveySampleColumnMapping,
  columns: SurveySampleColumnInfo[],
): number {
  let count = 0;
  for (let i = 0; i < dataRows.length; i++) {
    const cells = buildRowCells(dataRows[i], columns);
    const uid = cells[mapping.uidColumn] ?? "";
    if (shouldImportRow(uid)) count++;
  }
  return count;
}

export function parseSurveySampleSpreadsheet(
  buffer: Buffer,
  format: ParticipationFormat = "site",
): SurveySampleSpreadsheetPreview {
  const matrix = readSpreadsheetMatrix(buffer);
  const columns = buildColumnInfos(matrix);
  const { rows: dataRows, excelRowIndexes } = listScannedRows(matrix);

  if (dataRows.length === 0) {
    throw new Error("엑셀에 읽을 수 있는 행이 없습니다.");
  }

  const suggested = guessSurveySampleColumns(matrix, columns, format);
  const importableRows = countImportableRows(dataRows, excelRowIndexes, suggested, columns);

  const previewDataRows: SurveySamplePreviewRow[] = [];
  for (let i = 0; i < dataRows.length && previewDataRows.length < MAX_PREVIEW_ROWS; i++) {
    const cells = buildRowCells(dataRows[i], columns);
    const uid = cells[suggested.uidColumn] ?? "";
    if (!shouldImportRow(uid)) continue;
    previewDataRows.push({
      rowIndex: excelRowIndexes[i],
      cells,
    });
  }

  return {
    columns,
    rows: previewDataRows,
    totalRows: dataRows.length,
    importableRows,
    suggestedColumns: suggested,
  };
}

export function collectEmailUploadWarnings(
  rows: { rowIndex: number; uid: string; email: string }[],
): SurveySampleUploadWarnings {
  const byEmail = new Map<string, string[]>();
  const invalidEmails: SurveySampleUploadWarnings["invalidEmails"] = [];

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (!isValidEmailAddress(row.email)) {
      invalidEmails.push({ uid: row.uid, email: row.email, rowIndex: row.rowIndex });
    }
    if (!email) continue;
    const list = byEmail.get(email) ?? [];
    list.push(row.uid);
    byEmail.set(email, list);
  }

  const duplicateEmails = [...byEmail.entries()]
    .filter(([, uids]) => uids.length > 1)
    .map(([email, uids]) => ({ email, uids: [...new Set(uids)] }));

  return { duplicateEmails, invalidEmails };
}

export function buildSurveySampleRows(
  buffer: Buffer,
  mapping: SurveySampleColumnMapping,
  format: ParticipationFormat = "site",
): {
  columns: SurveySampleColumnInfo[];
  rows: {
    rowIndex: number;
    uid: string;
    phone: string;
    email: string;
    rowData: Record<string, string>;
  }[];
  warnings?: SurveySampleUploadWarnings;
} {
  const matrix = readSpreadsheetMatrix(buffer);
  const columns = buildColumnInfos(matrix);
  assertMapping(mapping, columns, format);

  const { rows: dataRows, excelRowIndexes } = listScannedRows(matrix);

  if (dataRows.length === 0) {
    throw new Error("엑셀에 읽을 수 있는 행이 없습니다.");
  }

  const seenUids = new Map<string, number>();
  const duplicateUidList: string[] = [];
  const rows: {
    rowIndex: number;
    uid: string;
    phone: string;
    email: string;
    rowData: Record<string, string>;
  }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowData = buildRowCells(row, columns);
    const uid = rowData[mapping.uidColumn] ?? "";
    const phone = format === "site" ? (rowData[mapping.phoneColumn ?? ""] ?? "") : "";
    const email = format === "email" ? (rowData[mapping.emailColumn ?? ""] ?? "") : "";
    const excelRowIndex = excelRowIndexes[i];

    if (!shouldImportRow(uid)) {
      continue;
    }

    const prevRow = seenUids.get(uid);
    if (prevRow != null) {
      if (!duplicateUidList.includes(uid)) duplicateUidList.push(uid);
      continue;
    }
    seenUids.set(uid, excelRowIndex);

    rows.push({
      rowIndex: excelRowIndex,
      uid,
      phone,
      email,
      rowData,
    });
  }

  if (duplicateUidList.length > 0) {
    throw new Error(
      `UID가 중복되어 업로드할 수 없습니다. 중복 UID: ${duplicateUidList.join(", ")}`,
    );
  }

  if (rows.length === 0) {
    throw new Error(
      "업로드할 표본이 없습니다. 선택한 UID 열에 값이 있는 행이 한 건 이상 필요합니다.",
    );
  }

  if (rows.length > MAX_UPLOAD_ROWS) {
    throw new Error(`한 번에 업로드할 수 있는 행 수는 ${MAX_UPLOAD_ROWS.toLocaleString()}건입니다.`);
  }

  const result: ReturnType<typeof buildSurveySampleRows> = { columns, rows };
  if (format === "email") {
    result.warnings = collectEmailUploadWarnings(rows);
  }
  return result;
}

export function serializeColumnHeaders(columns: SurveySampleColumnInfo[]): string[] {
  return columns.map((col) => col.letter);
}

export function deserializeColumnHeaders(raw: unknown): SurveySampleColumnInfo[] {
  if (!Array.isArray(raw)) return [];
  const out: SurveySampleColumnInfo[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const colon = item.indexOf(":");
    const letter = (colon > 0 ? item.slice(0, colon) : item).trim().toUpperCase();
    const index = columnLetterToIndex(letter);
    if (index < 0) continue;
    out.push({
      letter,
      index,
      headerLabel: colon > 0 ? item.slice(colon + 1).trim() : "",
    });
  }
  return out;
}
