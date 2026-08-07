/** 공개 홈 등 Shadow DOM에서 사이트 AXI 패널을 열 때 사용 */
export const AXI_OPEN_EVENT = "research-a:open-axi";

export function requestOpenAxi(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AXI_OPEN_EVENT));
}

export function isPlatformAxiAvailable(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.axiReady === "1";
}
