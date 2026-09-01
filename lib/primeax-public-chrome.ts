/** ZIP 공개 홈 시안과 동일한 상단 앵커 네비 */
export const PRIMEAX_HOME_NAV = [
  { key: "why", label: "ABOUT PRIME AX", hash: "why" },
  { key: "services", label: "RESEARCH SERVICES", hash: "services" },
  { key: "engine", label: "KSIC ENGINE", hash: "engine" },
  { key: "axi", label: "AXI", hash: "axi" },
  { key: "proof", label: "PERFORMANCE", hash: "proof" },
  { key: "contact", label: "CONTACT", hash: "contact" },
] as const;

export const PRIMEAX_FOOTER = {
  tagline: "HUMAN INSIGHT",
  taglineAccent: "AI INTELLIGENCE",
  companyLabel: "PRIME AX",
  companyNameKo: "프라임에이엑스",
  address: "대전광역시 중구 계백로 1719, 센트리아오피스텔 503호",
  email: "best@primeax.co.kr",
  webLabel: "primeax.co.kr ↗",
  webHref: "https://www.primeax.co.kr",
  copyright: "© 2026 PRIME AX. ALL RIGHTS RESERVED.",
  businessRegistrationNumber: "688-38-01651",
  backToTopLabel: "BACK TO TOP ↑",
} as const;

export function scrollToPrimeaxSection(hash: string): boolean {
  if (typeof document === "undefined") return false;
  const id = hash.replace(/^#/, "").trim();
  if (!id) return false;

  // 맨 위(#top)는 문서 최상단으로 이동
  if (id === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  const host = document.querySelector<HTMLElement>("[data-primeax-home]");
  const fromShadow = host?.shadowRoot?.getElementById(id);
  const el = fromShadow ?? document.getElementById(id);
  if (!el) return false;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/** 홈 Shadow DOM 준비 전후를 고려해 섹션으로 스크롤 */
export function scrollToPrimeaxSectionWhenReady(
  hash: string,
  attempts = 24,
  intervalMs = 50,
): void {
  if (scrollToPrimeaxSection(hash)) return;
  let left = attempts;
  const timer = window.setInterval(() => {
    left -= 1;
    if (scrollToPrimeaxSection(hash) || left <= 0) {
      window.clearInterval(timer);
    }
  }, intervalMs);
}
