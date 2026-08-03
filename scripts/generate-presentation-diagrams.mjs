/**
 * Generates presentation SVGs (UTF-8) and PNG exports.
 * Run: node scripts/generate-presentation-diagrams.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Resvg } = require("@resvg/resvg-js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "presentation");
mkdirSync(outDir, { recursive: true });

const css = `
  .title { font: 700 32px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #0f172a; }
  .subtitle { font: 500 16px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
  .h { font: 700 15px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #0f172a; }
  .p { font: 500 13px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #334155; }
  .small { font: 500 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
  .layer { font: 700 13px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .arrow { font: 600 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #475569; }
  .lane { font: 700 14px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .num { font: 700 13px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .foot { font: 500 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
  .badge { font: 700 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .opt { font: 600 13px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #0f172a; }
  .th { font: 700 13px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .ent { font: 700 13px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #0f172a; }
  .col { font: 500 11px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
  .sec { font: 700 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
`;

const defsCommon = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
    <marker id="arr" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="#64748b"/>
    </marker>
    <marker id="arrTeal" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="#0f766e"/>
    </marker>
    <marker id="arrAmber" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="#b45309"/>
    </marker>
    <style>${css}</style>
  </defs>
`;

function svg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
${defsCommon}
<rect width="1600" height="900" fill="url(#bg)"/>
${body}
</svg>`;
}

const diagrams = {
  "01-system-architecture": svg(`
  <text x="80" y="64" class="title">시스템 전체 구조</text>
  <text x="80" y="94" class="subtitle">Next.js App Router · Supabase · AI · CATI 통합 설문 플랫폼</text>

  <g filter="url(#shadow)">
    <rect x="140" y="140" width="380" height="150" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="140" y="140" width="380" height="40" rx="16" fill="#0f172a"/>
    <rect x="140" y="164" width="380" height="16" fill="#0f172a"/>
    <text x="160" y="166" class="layer">1. 사용자 채널</text>
    <text x="168" y="210" class="h">공개 사이트</text>
    <text x="168" y="232" class="p">랜딩 · 설문 목록 · 참여 · CMS 페이지</text>
    <text x="168" y="262" class="h">관리자 패널 /admin</text>
    <text x="168" y="284" class="p">설문 · 표본 · 권한 · 홈/배너 CMS</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="540" y="140" width="380" height="150" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="540" y="140" width="380" height="40" rx="16" fill="#0f766e"/>
    <rect x="540" y="164" width="380" height="16" fill="#0f766e"/>
    <text x="560" y="166" class="layer">2. 면접원 (CATI)</text>
    <text x="568" y="210" class="h">전화 조사 워크플로</text>
    <text x="568" y="232" class="p">표본 배정 · 통화 결과 · 응답 초안</text>
    <text x="568" y="262" class="h">응답 스크립트</text>
    <text x="568" y="284" class="p">/survey-script · 현장 멘트</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="940" y="140" width="500" height="150" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="940" y="140" width="500" height="40" rx="16" fill="#1e3a5f"/>
    <rect x="940" y="164" width="500" height="16" fill="#1e3a5f"/>
    <text x="960" y="166" class="layer">3. 역할</text>
    <text x="968" y="214" class="h">guest</text>
    <text x="1080" y="214" class="p">일반 응답</text>
    <text x="968" y="244" class="h">employee+</text>
    <text x="1080" y="244" class="p">CATI · 스크립트</text>
    <text x="968" y="274" class="h">sub / super_admin</text>
    <text x="1180" y="274" class="p">관리자 전체 기능</text>
  </g>

  <line x1="800" y1="300" x2="800" y2="330" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <text x="812" y="322" class="arrow">HTTPS</text>

  <g filter="url(#shadow)">
    <rect x="140" y="340" width="1300" height="200" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="140" y="340" width="1300" height="44" rx="16" fill="#134e4a"/>
    <rect x="140" y="368" width="1300" height="16" fill="#134e4a"/>
    <text x="160" y="368" class="layer">4. Application — Next.js 15 · React 19 · TypeScript · Tailwind</text>

    <rect x="168" y="404" width="290" height="110" rx="12" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="184" y="432" class="h">app/(site)</text>
    <text x="184" y="456" class="p">공개 UI · RSC</text>
    <text x="184" y="478" class="p">SurveyResponseForm</text>
    <text x="184" y="500" class="small">참여 · 마이페이지</text>

    <rect x="478" y="404" width="290" height="110" rx="12" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="494" y="432" class="h">app/admin</text>
    <text x="494" y="456" class="p">패널 · Auth 가드</text>
    <text x="494" y="478" class="p">빌더 · AI · 표본</text>
    <text x="494" y="500" class="small">CMS · 권한 · 진행</text>

    <rect x="788" y="404" width="290" height="110" rx="12" fill="#ecfeff" stroke="#a5f3fc"/>
    <text x="804" y="432" class="h">app/actions</text>
    <text x="804" y="456" class="p">Server Actions</text>
    <text x="804" y="478" class="p">제출 · CRUD · AI</text>
    <text x="804" y="500" class="small">검증 후 저장</text>

    <rect x="1098" y="404" width="310" height="110" rx="12" fill="#fff7ed" stroke="#fed7aa"/>
    <text x="1114" y="432" class="h">lib/</text>
    <text x="1114" y="456" class="p">도메인 로직</text>
    <text x="1114" y="478" class="p">visibility · persist</text>
    <text x="1114" y="500" class="small">survey-ai · cati · supabase</text>
  </g>

  <line x1="800" y1="550" x2="800" y2="580" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <text x="812" y="572" class="arrow">Service Role / Auth</text>

  <g filter="url(#shadow)">
    <rect x="140" y="590" width="820" height="170" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="140" y="590" width="820" height="44" rx="16" fill="#1e3a5f"/>
    <rect x="140" y="618" width="820" height="16" fill="#1e3a5f"/>
    <text x="160" y="618" class="layer">5. Supabase</text>
    <rect x="168" y="654" width="180" height="84" rx="10" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="184" y="684" class="h">Postgres</text>
    <text x="184" y="708" class="p">설문·응답·표본</text>
    <text x="184" y="726" class="small">RLS</text>
    <rect x="368" y="654" width="180" height="84" rx="10" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="384" y="684" class="h">Auth</text>
    <text x="384" y="708" class="p">세션 · 프로필</text>
    <text x="384" y="726" class="small">역할 기반</text>
    <rect x="568" y="654" width="180" height="84" rx="10" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="584" y="684" class="h">Storage</text>
    <text x="584" y="708" class="p">문항 미디어</text>
    <text x="584" y="726" class="small">사이트 자산</text>
    <rect x="768" y="654" width="168" height="84" rx="10" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="784" y="684" class="h">Migrations</text>
    <text x="784" y="708" class="p">스키마 버전</text>
    <text x="784" y="726" class="small">supabase/</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="990" y="590" width="450" height="170" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="990" y="590" width="450" height="44" rx="16" fill="#7c2d12"/>
    <rect x="990" y="618" width="450" height="16" fill="#7c2d12"/>
    <text x="1010" y="618" class="layer">6. 외부 서비스</text>
    <text x="1020" y="674" class="h">LLM (OpenAI / Gemini)</text>
    <text x="1020" y="698" class="p">AI 설문안 · CATI 스크립트 초안</text>
    <text x="1020" y="728" class="h">공공데이터 · KSIC</text>
    <text x="1020" y="752" class="p">산업분류 · 외부 검증</text>
  </g>

  <text x="80" y="860" class="foot">research-a · 발표용 01/04 · 쓰기 경로: Server Actions → Service Role (anon 직접 INSERT 없음)</text>
`),

  "02-business-flows": svg(`
  <text x="72" y="58" class="title">핵심 업무 흐름</text>
  <text x="72" y="88" class="subtitle">설문 설계 → 배포 → 응답 → 집계 · 관리자 · 응답자 · 면접원</text>

  <rect x="72" y="120" width="1456" height="220" rx="18" fill="#fff" stroke="#cbd5e1" filter="url(#shadow)"/>
  <rect x="72" y="120" width="56" height="220" rx="18" fill="#0f766e"/>
  <rect x="100" y="120" width="28" height="220" fill="#0f766e"/>
  <text transform="translate(100 230) rotate(-90)" class="lane" text-anchor="middle">관리자</text>
  <circle cx="200" cy="180" r="16" fill="#0f766e"/><text x="200" y="185" class="num" text-anchor="middle">1</text>
  <text x="228" y="178" class="h">조사 설계</text>
  <text x="228" y="198" class="p">수작업 빌더 또는 AI 생성</text>
  <line x1="430" y1="180" x2="490" y2="180" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="530" cy="180" r="16" fill="#0f766e"/><text x="530" y="185" class="num" text-anchor="middle">2</text>
  <text x="558" y="178" class="h">문항 · 로직 설정</text>
  <text x="558" y="198" class="p">표시 조건 · 조사 종료 보기</text>
  <line x1="780" y1="180" x2="840" y2="180" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="880" cy="180" r="16" fill="#0f766e"/><text x="880" y="185" class="num" text-anchor="middle">3</text>
  <text x="908" y="178" class="h">저장 · 배포</text>
  <text x="908" y="198" class="p">기간 · 공개 여부 · 배분</text>
  <line x1="1120" y1="180" x2="1180" y2="180" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="1220" cy="180" r="16" fill="#0f766e"/><text x="1220" y="185" class="num" text-anchor="middle">4</text>
  <text x="1248" y="178" class="h">표본 · CATI</text>
  <text x="1248" y="198" class="p">xlsx 업로드 · 배치</text>
  <rect x="168" y="240" width="1280" height="72" rx="12" fill="#f0fdfa" stroke="#99f6e4"/>
  <text x="188" y="270" class="h">주요 경로</text>
  <text x="188" y="294" class="p">/admin/surveys → new · edit · ai-generate · logic · samples · distribute · Server Actions → DB</text>

  <rect x="72" y="360" width="1456" height="220" rx="18" fill="#fff" stroke="#cbd5e1" filter="url(#shadow)"/>
  <rect x="72" y="360" width="56" height="220" rx="18" fill="#1e3a5f"/>
  <rect x="100" y="360" width="28" height="220" fill="#1e3a5f"/>
  <text transform="translate(100 470) rotate(-90)" class="lane" text-anchor="middle">응답자</text>
  <circle cx="200" cy="420" r="16" fill="#1e3a5f"/><text x="200" y="425" class="num" text-anchor="middle">1</text>
  <text x="228" y="418" class="h">설문 진입</text>
  <text x="228" y="438" class="p">/survey/[slug]</text>
  <line x1="430" y1="420" x2="490" y2="420" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="530" cy="420" r="16" fill="#1e3a5f"/><text x="530" y="425" class="num" text-anchor="middle">2</text>
  <text x="558" y="418" class="h">조건부 진행</text>
  <text x="558" y="438" class="p">보이는 문항만 표시</text>
  <line x1="780" y1="420" x2="840" y2="420" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="880" cy="420" r="16" fill="#1e3a5f"/><text x="880" y="425" class="num" text-anchor="middle">3</text>
  <text x="908" y="418" class="h">답변 입력</text>
  <text x="908" y="438" class="p">페이지 / 스크롤 모드</text>
  <line x1="1120" y1="420" x2="1180" y2="420" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="1220" cy="420" r="16" fill="#1e3a5f"/><text x="1220" y="425" class="num" text-anchor="middle">4</text>
  <text x="1248" y="418" class="h">제출</text>
  <text x="1248" y="438" class="p">responses + answers</text>
  <rect x="168" y="480" width="1280" height="72" rx="12" fill="#eff6ff" stroke="#bfdbfe"/>
  <text x="188" y="510" class="h">서버 검증</text>
  <text x="188" y="534" class="p">loadSurvey → SurveyResponseForm → submitSurveyResponseAction (보이는 문항만 · Service Role)</text>

  <rect x="72" y="600" width="1456" height="200" rx="18" fill="#fff" stroke="#cbd5e1" filter="url(#shadow)"/>
  <rect x="72" y="600" width="56" height="200" rx="18" fill="#9a3412"/>
  <rect x="100" y="600" width="28" height="200" fill="#9a3412"/>
  <text transform="translate(100 700) rotate(-90)" class="lane" text-anchor="middle">면접원</text>
  <circle cx="200" cy="660" r="16" fill="#9a3412"/><text x="200" y="665" class="num" text-anchor="middle">1</text>
  <text x="228" y="658" class="h">표본 수신</text>
  <text x="228" y="678" class="p">배치된 연락처</text>
  <line x1="430" y1="660" x2="490" y2="660" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="530" cy="660" r="16" fill="#9a3412"/><text x="530" y="665" class="num" text-anchor="middle">2</text>
  <text x="558" y="658" class="h">통화 · 스크립트</text>
  <text x="558" y="678" class="p">멘트 · 주의사항</text>
  <line x1="780" y1="660" x2="840" y2="660" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="880" cy="660" r="16" fill="#9a3412"/><text x="880" y="665" class="num" text-anchor="middle">3</text>
  <text x="908" y="658" class="h">응답 / 초안</text>
  <text x="908" y="678" class="p">중도 저장 · 재개</text>
  <line x1="1120" y1="660" x2="1180" y2="660" stroke="#94a3b8" stroke-width="2" marker-end="url(#arr)"/>
  <circle cx="1220" cy="660" r="16" fill="#9a3412"/><text x="1220" y="665" class="num" text-anchor="middle">4</text>
  <text x="1248" y="658" class="h">컨택 결과</text>
  <text x="1248" y="678" class="p">완료 · 콜백 · 제외 등</text>
  <rect x="168" y="720" width="1280" height="56" rx="12" fill="#fff7ed" stroke="#fed7aa"/>
  <text x="188" y="754" class="p">CatiInterviewerWorkflow · samples / drafts / contact_options · 진행 현황 모니터링</text>

  <text x="72" y="860" class="foot">research-a · 발표용 02/04 · 세 역할이 동일 설문 데이터를 공유하고 진입 UI만 분리</text>
`),

  "03-branching-logic": svg(`
  <text x="72" y="58" class="title">설문 분기 · 조사 종료 로직</text>
  <text x="72" y="88" class="subtitle">표시 조건(visibility) + 보기별 조사 종료(ends_survey) · lib/survey-visibility.ts</text>

  <g filter="url(#shadow)">
    <rect x="680" y="120" width="240" height="56" rx="28" fill="#0f766e"/>
    <text x="800" y="154" class="badge" text-anchor="middle" style="font-size:15px">설문 시작</text>
  </g>
  <line x1="800" y1="176" x2="800" y2="220" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>

  <g filter="url(#shadow)">
    <rect x="620" y="220" width="360" height="100" rx="16" fill="#fff" stroke="#0f766e" stroke-width="2"/>
    <text x="800" y="258" class="h" text-anchor="middle">스크리닝 문항 (Q1)</text>
    <text x="800" y="284" class="p" text-anchor="middle">객관식 단일 · 드롭다운</text>
    <text x="800" y="306" class="small" text-anchor="middle">분기 기준 유형만 허용</text>
  </g>

  <path d="M800 320 L800 360 L520 360 L520 400" fill="none" stroke="#0f766e" stroke-width="2.5" marker-end="url(#arrTeal)"/>
  <path d="M800 320 L800 360 L1080 360 L1080 400" fill="none" stroke="#b45309" stroke-width="2.5" marker-end="url(#arrAmber)"/>

  <g filter="url(#shadow)">
    <rect x="400" y="400" width="240" height="70" rx="12" fill="#ecfdf5" stroke="#0f766e" stroke-width="2"/>
    <text x="520" y="430" class="opt" text-anchor="middle">1. 예</text>
    <text x="520" y="454" class="small" text-anchor="middle">본조사 계속</text>
  </g>
  <g filter="url(#shadow)">
    <rect x="960" y="400" width="240" height="70" rx="12" fill="#fffbeb" stroke="#b45309" stroke-width="2"/>
    <text x="1080" y="430" class="opt" text-anchor="middle">2. 아니오</text>
    <text x="1080" y="454" class="small" text-anchor="middle">ends_survey = true</text>
  </g>

  <line x1="520" y1="470" x2="520" y2="520" stroke="#0f766e" stroke-width="2" marker-end="url(#arrTeal)"/>
  <line x1="1080" y1="470" x2="1080" y2="560" stroke="#b45309" stroke-width="2" marker-end="url(#arrAmber)"/>

  <g filter="url(#shadow)">
    <rect x="380" y="520" width="280" height="90" rx="14" fill="#fff" stroke="#cbd5e1"/>
    <text x="520" y="556" class="h" text-anchor="middle">후속 문항 Q2…Qn</text>
    <text x="520" y="582" class="p" text-anchor="middle">표시 조건(선택)</text>
    <text x="520" y="600" class="small" text-anchor="middle">또는 항상 표시</text>
  </g>
  <g filter="url(#shadow)">
    <rect x="960" y="560" width="240" height="70" rx="14" fill="#b45309"/>
    <text x="1080" y="592" class="badge" text-anchor="middle" style="font-size:14px">조사 종료</text>
    <text x="1080" y="614" class="badge" text-anchor="middle" style="font-size:11px;font-weight:500">이후 문항 숨김 → 제출</text>
  </g>

  <line x1="520" y1="610" x2="520" y2="680" stroke="#64748b" stroke-width="2"/>
  <path d="M520 680 H800" stroke="#64748b" stroke-width="2"/>
  <path d="M1080 630 V680 H800" stroke="#64748b" stroke-width="2" marker-end="url(#arr)"/>

  <g filter="url(#shadow)">
    <rect x="680" y="700" width="240" height="56" rx="28" fill="#1e3a5f"/>
    <text x="800" y="734" class="badge" text-anchor="middle" style="font-size:15px">응답 제출</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="72" y="220" width="300" height="360" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="220" width="300" height="44" rx="16" fill="#0f172a"/>
    <rect x="72" y="248" width="300" height="16" fill="#0f172a"/>
    <text x="92" y="248" class="badge">문항이 보이는 조건</text>
    <text x="96" y="300" class="h">1. staffOnly</text>
    <text x="96" y="322" class="p">직원 전용이면 guest 숨김</text>
    <text x="96" y="360" class="h">2. visibilityRules</text>
    <text x="96" y="382" class="p">이전 보기 선택 시 표시</text>
    <text x="96" y="402" class="small">여러 조건은 OR</text>
    <text x="96" y="440" class="h">3. ends_survey</text>
    <text x="96" y="462" class="p">앞 문항에서 종료 보기</text>
    <text x="96" y="482" class="p">선택 시 이후 전부 숨김</text>
    <rect x="96" y="510" width="252" height="48" rx="10" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="112" y="540" class="small">isQuestionShownInSurvey()</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="1228" y="220" width="300" height="360" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="1228" y="220" width="300" height="44" rx="16" fill="#9a3412"/>
    <rect x="1228" y="248" width="300" height="16" fill="#9a3412"/>
    <text x="1248" y="248" class="badge">기존 vs 개선</text>
    <text x="1252" y="300" class="h">Before</text>
    <text x="1252" y="324" class="p">후속 문항마다</text>
    <text x="1252" y="344" class="p">「예」 표시 조건 반복</text>
    <text x="1252" y="390" class="h">After</text>
    <text x="1252" y="414" class="p">「아니오」에</text>
    <text x="1252" y="434" class="p">조사 종료 체크만</text>
    <rect x="1252" y="470" width="252" height="80" rx="10" fill="#fffbeb" stroke="#fcd34d"/>
    <text x="1268" y="504" class="p">DB: options.ends_survey</text>
    <text x="1268" y="528" class="p">편집 UI: 보기별 체크박스</text>
  </g>

  <text x="72" y="860" class="foot">research-a · 발표용 03/04 · 스크리닝 「아니오 → 조사종료」를 옵션 플래그로 처리</text>
`),

  "04-data-and-modules": svg(`
  <text x="72" y="54" class="title">데이터 모델 · 모듈 맵</text>
  <text x="72" y="82" class="subtitle">핵심 엔티티 관계와 코드 폴더 구조</text>

  <g filter="url(#shadow)">
    <rect x="72" y="110" width="900" height="620" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="110" width="900" height="44" rx="18" fill="#1e3a5f"/>
    <rect x="72" y="138" width="900" height="16" fill="#1e3a5f"/>
    <text x="92" y="138" class="th">핵심 데이터 모델 (Supabase Postgres)</text>

    <rect x="110" y="180" width="200" height="120" rx="10" fill="#eff6ff" stroke="#93c5fd"/>
    <rect x="110" y="180" width="200" height="32" rx="10" fill="#1e40af"/>
    <rect x="110" y="200" width="200" height="12" fill="#1e40af"/>
    <text x="126" y="202" class="sec">surveys</text>
    <text x="126" y="232" class="col">slug · title · status</text>
    <text x="126" y="252" class="col">period · listed_public</text>
    <text x="126" y="272" class="col">response_script</text>
    <text x="126" y="288" class="col">target_count</text>

    <rect x="390" y="180" width="220" height="140" rx="10" fill="#f0fdfa" stroke="#5eead4"/>
    <rect x="390" y="180" width="220" height="32" rx="10" fill="#0f766e"/>
    <rect x="390" y="200" width="220" height="12" fill="#0f766e"/>
    <text x="406" y="202" class="sec">survey_questions</text>
    <text x="406" y="232" class="col">type · prompt · order</text>
    <text x="406" y="252" class="col">visibility_rules</text>
    <text x="406" y="272" class="col">staff_only · allow_skip</text>
    <text x="406" y="292" class="col">media · info_body</text>

    <rect x="690" y="180" width="230" height="140" rx="10" fill="#fffbeb" stroke="#fcd34d"/>
    <rect x="690" y="180" width="230" height="32" rx="10" fill="#b45309"/>
    <rect x="690" y="200" width="230" height="12" fill="#b45309"/>
    <text x="706" y="202" class="sec">question_options</text>
    <text x="706" y="232" class="col">label · order_index</text>
    <text x="706" y="252" class="col">is_other</text>
    <text x="706" y="272" class="col">ends_survey (NEW)</text>
    <text x="706" y="292" class="col">조사 종료 플래그</text>

    <line x1="310" y1="240" x2="390" y2="240" stroke="#94a3b8" stroke-width="2"/>
    <line x1="610" y1="240" x2="690" y2="240" stroke="#94a3b8" stroke-width="2"/>
    <text x="330" y="228" class="col">1:N</text>
    <text x="630" y="228" class="col">1:N</text>

    <rect x="110" y="380" width="220" height="120" rx="10" fill="#f5f3ff" stroke="#c4b5fd"/>
    <rect x="110" y="380" width="220" height="32" rx="10" fill="#5b21b6"/>
    <rect x="110" y="400" width="220" height="12" fill="#5b21b6"/>
    <text x="126" y="402" class="sec">survey_responses</text>
    <text x="126" y="432" class="col">respondent · timestamps</text>
    <text x="126" y="452" class="col">완료 응답 1건</text>
    <text x="126" y="472" class="col">→ answers (jsonb)</text>

    <rect x="390" y="380" width="220" height="120" rx="10" fill="#f5f3ff" stroke="#c4b5fd"/>
    <rect x="390" y="380" width="220" height="32" rx="10" fill="#5b21b6"/>
    <rect x="390" y="400" width="220" height="12" fill="#5b21b6"/>
    <text x="406" y="402" class="sec">response_answers</text>
    <text x="406" y="432" class="col">question_id</text>
    <text x="406" y="452" class="col">answer jsonb</text>
    <text x="406" y="472" class="col">유형별 스키마</text>

    <line x1="210" y1="300" x2="210" y2="380" stroke="#94a3b8" stroke-width="2"/>
    <line x1="330" y1="440" x2="390" y2="440" stroke="#94a3b8" stroke-width="2"/>
    <text x="220" y="348" class="col">1:N</text>

    <rect x="690" y="380" width="230" height="120" rx="10" fill="#fff7ed" stroke="#fdba74"/>
    <rect x="690" y="380" width="230" height="32" rx="10" fill="#9a3412"/>
    <rect x="690" y="400" width="230" height="12" fill="#9a3412"/>
    <text x="706" y="402" class="sec">CATI / 표본</text>
    <text x="706" y="432" class="col">sample_batches</text>
    <text x="706" y="452" class="col">samples · drafts</text>
    <text x="706" y="472" class="col">contact_options</text>

    <rect x="110" y="540" width="360" height="150" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="126" y="570" class="ent">Auth · 조직</text>
    <text x="126" y="596" class="col">profiles (역할) · admin_settings · permissions</text>
    <text x="126" y="620" class="ent">사이트 CMS</text>
    <text x="126" y="646" class="col">nav · pages · banners · homepage settings</text>
    <text x="126" y="670" class="col">Storage: 사이트·문항 미디어</text>

    <rect x="500" y="540" width="420" height="150" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="516" y="570" class="ent">문항 유형 (question_type)</text>
    <text x="516" y="598" class="col">mc_single · mc_multi · dropdown · rank</text>
    <text x="516" y="620" class="col">text_single · text_multi · likert_7 · likert_multi</text>
    <text x="516" y="642" class="col">star_rating · info_media · contact_fields</text>
    <text x="516" y="668" class="col">상태: 예정 · 진행중 · 종료</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="1000" y="110" width="528" height="620" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="1000" y="110" width="528" height="44" rx="18" fill="#0f766e"/>
    <rect x="1000" y="138" width="528" height="16" fill="#0f766e"/>
    <text x="1020" y="138" class="th">코드 모듈 맵</text>
    <text x="1028" y="190" class="h">app/</text>
    <text x="1028" y="212" class="p">(site) 공개 · admin 관리 · actions 서버</text>
    <text x="1028" y="252" class="h">components/</text>
    <text x="1028" y="274" class="p">site/ 참여·CATI UI</text>
    <text x="1028" y="294" class="p">admin/ 빌더·로직·CMS·AI</text>
    <text x="1028" y="334" class="h">lib/</text>
    <text x="1028" y="356" class="p">survey-public · persist · visibility</text>
    <text x="1028" y="376" class="p">survey-ai/ · cati-* · supabase/</text>
    <text x="1028" y="416" class="h">supabase/migrations/</text>
    <text x="1028" y="438" class="p">스키마 · RLS · Storage 정책</text>
    <rect x="1028" y="470" width="472" height="220" rx="12" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="1044" y="504" class="h">요청 처리 한 줄</text>
    <text x="1044" y="536" class="p">Browser</text>
    <text x="1044" y="560" class="p">→ Next.js (RSC / Client)</text>
    <text x="1044" y="584" class="p">→ Server Action + lib 검증</text>
    <text x="1044" y="608" class="p">→ Supabase Service Role</text>
    <text x="1044" y="632" class="p">→ Postgres / Storage / Auth</text>
    <text x="1044" y="660" class="col">(+ LLM · 공공데이터 선택 호출)</text>
  </g>

  <text x="72" y="860" class="foot">research-a · 발표용 04/04 · ends_survey는 최근 추가된 스크리닝 종료 기능</text>
`),
};

for (const [name, content] of Object.entries(diagrams)) {
  const svgPath = join(outDir, `${name}.svg`);
  writeFileSync(svgPath, content, "utf8");
  const resvg = new Resvg(Buffer.from(content, "utf8"), {
    fitTo: { mode: "width", value: 1920 },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "Malgun Gothic",
    },
  });
  const png = resvg.render().asPng();
  const pngPath = join(outDir, `${name}.png`);
  writeFileSync(pngPath, png);
  console.log("OK", name, "svg+png", png.length);
}

writeFileSync(
  join(outDir, "README.md"),
  `# 발표용 구조·흐름도

PPT에 **PNG**를 삽입하세요 (16:9, 1920px 폭). SVG는 편집·재생성용입니다.

| 파일 | 슬라이드 용도 |
|------|---------------|
| \`01-system-architecture.png\` | 시스템 전체 구조 (계층) |
| \`02-business-flows.png\` | 관리자·응답자·면접원 업무 흐름 |
| \`03-branching-logic.png\` | 표시 조건 + 조사 종료 분기 |
| \`04-data-and-modules.png\` | 데이터 모델 · 코드 모듈 |

재생성: \`node scripts/generate-presentation-diagrams.mjs\`
`,
  "utf8",
);

console.log("Done →", outDir);
