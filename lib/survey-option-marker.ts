/** 객관식·드롭다운 보기 앞 번호 (1→①, 2→② …, 21+는 "21." 폴백)
 * 응답 화면 표시는 비활성화됨. 내보내기 등에서 필요하면 재사용. */
export function formatSurveyOptionMarker(optionIndex: number): string {
  const n = optionIndex + 1;
  if (n >= 1 && n <= 20) {
    return String.fromCharCode(0x2460 + optionIndex);
  }
  return `${n}.`;
}
