export type CatiContactOption = {
  id: string;
  position: number;
  label: string;
  isSuccess: boolean;
  isActive: boolean;
};

/** 기본 컨택 결과 선택지 — 설문에 저장된 선택지가 없을 때 사용 */
export const DEFAULT_CATI_CONTACT_OPTIONS: { label: string; isSuccess: boolean }[] = [
  { label: "성공", isSuccess: true },
  { label: "비수신", isSuccess: false },
  { label: "바쁨/나중에", isSuccess: false },
  { label: "부재", isSuccess: false },
  { label: "출장", isSuccess: false },
  { label: "거절", isSuccess: false },
  { label: "전화번호 오류", isSuccess: false },
  { label: "리스트 중복", isSuccess: false },
  { label: "조사대상 아님", isSuccess: false },
  { label: "연구부서 확인요망", isSuccess: false },
  { label: "기타", isSuccess: false },
];

export function defaultCatiContactOptions(): CatiContactOption[] {
  return DEFAULT_CATI_CONTACT_OPTIONS.map((o, i) => ({
    id: `default-${i + 1}`,
    position: i + 1,
    label: o.label,
    isSuccess: o.isSuccess,
    isActive: true,
  }));
}

export type CatiContactOptionInput = {
  label: string;
  isSuccess: boolean;
  isActive: boolean;
};

export type SaveCatiContactOptionsResult =
  | { ok: true; options: CatiContactOption[] }
  | { ok: false; error: string };

export const MAX_CATI_CONTACT_OPTIONS = 40;
export const MAX_CATI_CONTACT_LABEL_LENGTH = 60;
