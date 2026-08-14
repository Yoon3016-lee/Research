/** CMS 회사 소개 페이지 — ZIP about-reference 보드 렌더용 */

export const ABOUT_COMPANY_MARKER = "<!-- primeax:about-company -->";
export const ABOUT_COMPANY_SLUG = "company-intro";

export type AboutCompanyPageRef = {
  slug: string;
  title: string;
  body: string;
};

export function isAboutCompanyPage(page: AboutCompanyPageRef): boolean {
  if (page.slug === ABOUT_COMPANY_SLUG) return true;
  if (page.title.trim() === "회사 소개") return true;
  if (page.body.includes(ABOUT_COMPANY_MARKER)) return true;
  return false;
}

const ASSET_BASE = "/primeax-home/assets";

type ReferenceSection = {
  number: string;
  label: string;
  subtitle: string;
  image: string;
  alt: string;
  overlays: string;
};

const REFERENCES: ReferenceSection[] = [
  {
    number: "01",
    label: "회사 소개",
    subtitle: "AI 리서치 플랫폼으로 조사 설계부터 분석·보고까지 연결합니다.",
    image: `${ASSET_BASE}/about-reference-01.png`,
    alt: "회사 소개 핵심 구성",
    overlays: `<span class="reference-survey-label">AI 설문 플랫폼</span><span class="reference-method-label">조사방법</span><div class="method-motion-panel" aria-label="조사 진행률 87퍼센트"><div class="method-motion-ring"><strong data-count="87">87</strong><span>%</span></div><div class="method-motion-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`,
  },
  {
    number: "02",
    label: "핵심 역량",
    subtitle: "AI 기술과 조사 운영 노하우를 결합한 통합 리서치 플랫폼",
    image: `${ASSET_BASE}/about-reference-02.png`,
    alt: "핵심 역량 구성",
    overlays: `<span class="reference-method-label reference-method-large"><b>조사방법</b><small>면접원 지원 · 통화 진행 · 품질 관리</small></span><svg class="reference-line-chart advisor-motion-chart" viewBox="0 0 240 100" aria-hidden="true"><polyline points="5,70 45,38 82,60 125,22 165,51 232,16" /><circle class="advisor-motion-dot" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M 5 70 L 45 38 L 82 60 L 125 22 L 165 51 L 232 16" /></circle></svg>`,
  },
  {
    number: "03",
    label: "핵심 업무 흐름",
    subtitle: "조사 설계부터 응답 수집, AI 분석, 보고·활용까지 연결합니다.",
    image: `${ASSET_BASE}/about-reference-03.png`,
    alt: "핵심 업무 흐름",
    overlays: `<span class="reference-method-label reference-method-workflow">조사방법</span><div class="reference-arrow-dots" aria-hidden="true"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div><div class="reference-bars bars-workflow" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`,
  },
  {
    number: "04",
    label: "플랫폼 구조",
    subtitle: "설문 운영부터 AI 분석까지 하나의 통합 플랫폼에서 연결합니다.",
    image: `${ASSET_BASE}/about-reference-04-no-axi.png`,
    alt: "플랫폼 구조",
    overlays: `<div class="reference-platform-copy platform-interviewer"><strong>조사 면접원</strong><small>전화 조사 · 응답 입력</small></div><div class="reference-platform-copy platform-respondent"><strong>응답자</strong><small>설문 응답 · 제출</small></div><div class="reference-platform-frames" aria-hidden="true"><i class="platform-frame-layer1"></i><i class="platform-frame-layer2"></i><i class="platform-frame-layer3"></i><i class="platform-frame-layer4"></i></div>`,
  },
];

export function buildAboutCompanyHtml(): string {
  const sections = REFERENCES.map(
    (ref) => `<section class="about-reference-section about-reference-${ref.number}" aria-label="${ref.number} ${ref.label}">
      <header class="about-reference-heading">
        <span>${ref.number}</span>
        <div><h1>${ref.label}</h1><p>${ref.subtitle}</p></div>
      </header>
      <div class="about-reference-frame">
        <div class="reference-media">
          <img class="reference-source" src="${ref.image}" alt="${ref.alt}" />
          ${ref.overlays}
        </div>
      </div>
    </section>`,
  ).join("");

  return `<div class="about-reference-pages" data-primeax-about-root>${sections}</div>`;
}
