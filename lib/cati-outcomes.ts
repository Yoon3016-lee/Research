/** CATI 통화·조사 결과 기록 값 (결과 열에 저장) */
export const CATI_OUTCOME_CONNECTED_FAIL = "연결실패";
export const CATI_OUTCOME_WRONG_NUMBER = "없는번호";
export const CATI_OUTCOME_COMPLETED = "완료";
export const CATI_OUTCOME_ABORTED = "중단";
export const CATI_OUTCOME_CALLBACK = "콜백";

/** 엑셀·시트에서 빈칸으로 취급하는 결과 값 */
const BLANK_OUTCOME_VALUES = new Set([
  "-",
  "—",
  "–",
  "_",
  ".",
  "·",
  "n/a",
  "na",
  "null",
  "none",
  "없음",
  "미정",
  "미기록",
  "공란",
  "공백",
  "해당없음",
  "해당 없음",
  "비어있음",
  "비어 있음",
  "#n/a",
  "#ref!",
  "#value!",
  "#div/0!",
  "#name?",
  "#null!",
  "#num!",
]);

const OUTCOME_HEADER_LIKE = /^(결과|유형|통화|상태|outcome|status|result|memo|비고|메모)$/i;

/** 보이지 않는 문자·공백 제거 후 빈칸이면 null */
export function normalizeCatiOutcomeValue(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;

  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .trim();

  if (!cleaned) return null;

  const folded = cleaned.toLowerCase().replace(/\s+/g, "");
  if (BLANK_OUTCOME_VALUES.has(folded) || BLANK_OUTCOME_VALUES.has(cleaned)) {
    return null;
  }
  if (OUTCOME_HEADER_LIKE.test(cleaned.replace(/\s/g, ""))) {
    return null;
  }

  return cleaned;
}

export type CatiOutcomeCode =
  | typeof CATI_OUTCOME_CONNECTED_FAIL
  | typeof CATI_OUTCOME_WRONG_NUMBER
  | typeof CATI_OUTCOME_COMPLETED
  | typeof CATI_OUTCOME_ABORTED
  | typeof CATI_OUTCOME_CALLBACK;

export type CatiSampleStatusTone = "new" | "info" | "warning" | "success" | "muted";

export type CatiSampleStatusDisplay = {
  label: string;
  description: string;
  tone: CatiSampleStatusTone;
};

export function describeCatiSampleStatus(
  outcomeValue: string | null | undefined,
): CatiSampleStatusDisplay {
  const value = normalizeCatiOutcomeValue(outcomeValue) ?? "";
  if (!value) {
    return {
      label: "신규 조사 대상",
      description: "아직 통화 결과가 기록되지 않았습니다.",
      tone: "new",
    };
  }
  if (value === CATI_OUTCOME_CONNECTED_FAIL) {
    return {
      label: "연결실패",
      description: "이전에 연결되지 않았다고 기록된 표본입니다.",
      tone: "warning",
    };
  }
  if (value === CATI_OUTCOME_WRONG_NUMBER) {
    return {
      label: "없는번호",
      description: "이전에 없는 번호로 기록된 표본입니다.",
      tone: "warning",
    };
  }
  if (value === CATI_OUTCOME_COMPLETED) {
    return {
      label: "완료",
      description: "이미 설문이 완료된 표본입니다. 재조사가 필요하면 다시 진행할 수 있습니다.",
      tone: "success",
    };
  }
  if (value === CATI_OUTCOME_ABORTED) {
    return {
      label: "중도포기",
      description: "이전 조사가 중단된 표본입니다.",
      tone: "info",
    };
  }
  if (value === CATI_OUTCOME_CALLBACK) {
    return {
      label: "콜백 예정",
      description: "나중에 다시 연락하기로 한 표본입니다.",
      tone: "info",
    };
  }
  return {
    label: value,
    description: "엑셀 또는 이전 조사에서 기록된 상태입니다.",
    tone: "muted",
  };
}

export function isKnownCatiOutcome(value: string): value is CatiOutcomeCode {
  return (
    value === CATI_OUTCOME_CONNECTED_FAIL ||
    value === CATI_OUTCOME_WRONG_NUMBER ||
    value === CATI_OUTCOME_COMPLETED ||
    value === CATI_OUTCOME_ABORTED ||
    value === CATI_OUTCOME_CALLBACK
  );
}
