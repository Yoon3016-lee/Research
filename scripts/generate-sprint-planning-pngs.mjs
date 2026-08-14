/**
 * 1단계 외주용역 — 스프린트 플래닝 (발주자용 PNG 전용)
 * Run: node scripts/generate-sprint-planning-pngs.mjs
 *
 * 역할
 * - PM: 이태우
 * - 개발총괄: 이상윤
 * - 기능 검수: 성용준
 *
 * - 출력: docs/sprint-planning/*.png (1920×1080)
 * - SVG는 저장하지 않음
 */
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Resvg } = require("@resvg/resvg-js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "sprint-planning");
mkdirSync(outDir, { recursive: true });

const W = 1920;
const H = 1080;
const FONT = "Malgun Gothic, Apple SD Gothic Neo, sans-serif";
const FS = 1.35;
const s = (n) => Math.round(n * FS);

const C = {
  navy: "#1e3a5f",
  teal: "#0f766e",
  slate: "#475569",
  amber: "#b45309",
  blue: "#1d4ed8",
  text: "#0f172a",
  muted: "#334155",
  soft: "#64748b",
  white: "#ffffff",
  whiteMuted: "#e2e8f0",
};

function t(x, y, size, weight, fill, content, anchor = "start") {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${s(size)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${content}</text>`;
}

function svg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e8eef5"/>
    </linearGradient>
    <linearGradient id="nav" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <filter id="shadow" x="-4%" y="-4%" width="108%" height="112%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.09"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${body}
</svg>`;
}

function header(title, page) {
  return `
  <rect x="0" y="0" width="${W}" height="92" fill="url(#nav)"/>
  ${t(36, 60, 30, 700, C.white, "1단계 외주용역 · 스프린트 플래닝")}
  ${t(W - 36, 60, 26, 600, C.whiteMuted, page, "end")}
  ${t(36, 168, 52, 700, C.text, title)}`;
}

function footer(note) {
  return t(36, H - 20, 22, 600, C.soft, note);
}

function roleCard(x, y, w, h, name, role, lines, accent, pillW, lineStartY = 200, lineGap = 48) {
  const linesXml = lines
    .map((line, i) => t(x + 28, y + lineStartY + i * lineGap, 24, 700, C.muted, line))
    .join("\n");
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="${x}" y="${y}" width="14" height="${h}" fill="${accent}"/>
    ${t(x + 28, y + 62, 36, 700, C.text, name)}
    <rect x="${x + 28}" y="${y + 82}" width="${pillW}" height="52" rx="26" fill="${accent}"/>
    ${t(x + 28 + pillW / 2, y + 118, 24, 700, C.white, role, "middle")}
    ${linesXml}
  </g>`;
}

function sprintBox(x, y, w, h, num, title, date, color) {
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <rect x="${x}" y="${y}" width="${w}" height="78" rx="16" fill="${color}"/>
    <rect x="${x}" y="${y + 52}" width="${w}" height="26" fill="${color}"/>
    ${t(x + w / 2, y + 54, 28, 700, C.white, `S${num}`, "middle")}
    ${t(x + 16, y + 138, 30, 700, C.text, title)}
    ${t(x + 16, y + 192, 26, 700, C.navy, date)}
  </g>`;
}

function sprintPanel(x, y, w, h, num, title, date, color, rows) {
  const rowH = 128;
  const rowsXml = rows
    .map((r, i) => {
      const yy = y + 148 + i * rowH;
      return `
      <rect x="${x + 16}" y="${yy}" width="${w - 32}" height="${rowH - 14}" rx="14" fill="#f8fafc" stroke="#e2e8f0"/>
      <circle cx="${x + 68}" cy="${yy + 57}" r="34" fill="${color}"/>
      ${t(x + 68, yy + 70, 26, 700, C.white, r.who[0], "middle")}
      ${t(x + 118, yy + 46, 30, 700, C.text, r.who)}
      ${t(x + 118, yy + 94, 24, 700, C.muted, r.task)}`;
    })
    .join("\n");
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="${x}" y="${y}" width="14" height="${h}" fill="${color}"/>
    ${t(x + 36, y + 62, 36, 700, C.text, `S${num}. ${title}`)}
    ${t(x + 36, y + 120, 26, 700, C.navy, date)}
    ${rowsXml}
  </g>`;
}

const diagrams = {
  "01-overview-roles": svg(`
  ${header("수행 개요 · 역할", "1 / 5")}

  <g filter="url(#shadow)">
    <rect x="36" y="196" width="1848" height="88" rx="16" fill="#fff" stroke="#cbd5e1"/>
    ${t(64, 254, 26, 700, C.muted, "KSIC·리서치 구조화 → RAG 매핑 · 내부 검증용 기본 플랫폼 구축")}
  </g>

  ${roleCard(36, 308, 420, 420, "이태우", "PM", [
    "• 프로젝트 진행 검토",
    "• 개발 방향 조정",
  ], C.navy, 140, 200, 52)}

  ${roleCard(480, 308, 960, 420, "이상윤", "개발총괄", [
    "• 요구사항 분석 · 범위 관리 · Sprint·일정",
    "• 시스템 설계 · Front-end / Back-end 개발",
    "• DB · 배포 환경 구축 · 테스트·검수 대응",
  ], C.teal, 200, 200, 52)}

  ${roleCard(1464, 308, 420, 420, "성용준", "기능 검수", [
    "• 시스템 기능 검수",
    "• 오류 테스트",
  ], C.amber, 180, 200, 52)}

  <g filter="url(#shadow)">
    <rect x="36" y="756" width="1848" height="268" rx="18" fill="#fff" stroke="#cbd5e1"/>
    ${t(64, 818, 34, 700, C.text, "추진 단계")}

    <rect x="64" y="848" width="560" height="140" rx="14" fill="#f0fdfa" stroke="#99f6e4"/>
    ${t(92, 908, 30, 700, C.teal, "1. 착수·설계")}
    ${t(92, 958, 24, 700, C.muted, "7.27~7.30 · 요구·검수 확정")}

    <rect x="680" y="848" width="560" height="140" rx="14" fill="#eff6ff" stroke="#93c5fd"/>
    ${t(708, 908, 30, 700, C.navy, "2. 개발·구현")}
    ${t(708, 958, 24, 700, C.muted, "7.31~8.10 · RAG·API·웹")}

    <rect x="1296" y="848" width="552" height="140" rx="14" fill="#fff7ed" stroke="#fdba74"/>
    ${t(1324, 908, 30, 700, C.amber, "3. 시험·검수")}
    ${t(1324, 958, 24, 700, C.muted, "8.11~8.13 · 테스트·인수")}
  </g>

  ${footer("기간 2026.7.27 ~ 8.13  ·  발주자 프라임에이엑스 · PM 이태우 · 개발총괄 이상윤 · 기능 검수 성용준")}
  `),

  "02-sprint-timeline": svg(`
  ${header("스프린트 타임라인", "2 / 5")}

  ${sprintBox(36, 196, 352, 220, "1", "착수·설계", "7.27~7.30", C.slate)}
  ${sprintBox(412, 196, 352, 220, "2", "데이터", "7.31~8.3", C.amber)}
  ${sprintBox(788, 196, 352, 220, "3", "KB·RAG", "8.4~8.7", C.teal)}
  ${sprintBox(1164, 196, 352, 220, "4", "플랫폼", "8.8~8.10", C.navy)}
  ${sprintBox(1540, 196, 344, 220, "5", "검수", "8.11~8.13", C.blue)}

  <g filter="url(#shadow)">
    <rect x="36" y="444" width="1848" height="576" rx="18" fill="#fff" stroke="#cbd5e1"/>
    ${t(68, 520, 36, 700, C.text, "마일스톤")}

    <circle cx="112" cy="610" r="36" fill="${C.slate}"/>
    ${t(112, 624, 26, 700, C.white, "1", "middle")}
    ${t(172, 626, 30, 700, C.text, "7.30  요구·검수 기준 확정  ·  이상윤(주) · 이태우 검토")}

    <circle cx="112" cy="720" r="36" fill="${C.amber}"/>
    ${t(112, 734, 26, 700, C.white, "2", "middle")}
    ${t(172, 736, 30, 700, C.text, "8.3  KSIC·모듈 적재 완료  ·  이상윤(주) · 성용준 검증")}

    <circle cx="112" cy="830" r="36" fill="${C.teal}"/>
    ${t(112, 844, 26, 700, C.white, "3", "middle")}
    ${t(172, 846, 30, 700, C.text, "8.7  RAG 매핑 핵심 동작  ·  이상윤(주) · 이태우 방향 검토")}

    <circle cx="112" cy="940" r="36" fill="${C.navy}"/>
    ${t(112, 954, 26, 700, C.white, "4", "middle")}
    ${t(172, 956, 30, 700, C.text, "8.10  기본 플랫폼 E2E  ·  이상윤(주) · 성용준 기능 검수")}
  </g>

  ${footer("8.13  테스트·최종 검수  ·  이상윤 보정 · 성용준 검수 · 이태우 진행 확인")}
  `),

  "03-sprint-1-2": svg(`
  ${header("Sprint 1 ~ 2", "3 / 5")}

  ${sprintPanel(36, 196, 908, 660, "1", "착수·설계", "7.27 ~ 7.30", C.slate, [
    { who: "이상윤", task: "요구분석 · 범위 · 설계 · 수행계획" },
    { who: "이태우", task: "진행 검토 · 개발 방향 조정" },
    { who: "성용준", task: "검수 기준 · 테스트 시나리오 초안" },
  ])}

  ${sprintPanel(976, 196, 908, 660, "2", "데이터", "7.31 ~ 8.3", C.amber, [
    { who: "이상윤", task: "KSIC 구조화 · 모듈 · DB 구축" },
    { who: "이태우", task: "데이터 범위·우선순위 검토" },
    { who: "성용준", task: "적재 결과 · 조회 기능 검증" },
  ])}

  <g filter="url(#shadow)">
    <rect x="36" y="880" width="908" height="148" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>
    ${t(64, 970, 26, 700, C.teal, "완료 (S1)  ·  범위·검수 기준 합의")}
  </g>
  <g filter="url(#shadow)">
    <rect x="976" y="880" width="908" height="148" rx="16" fill="#fff7ed" stroke="#fed7aa"/>
    ${t(1004, 970, 26, 700, C.amber, "완료 (S2)  ·  KSIC·모듈 적재·조회 가능")}
  </g>

  ${footer("산출: 요구사항 · 검수표 · KSIC 데이터 · 리서치 모듈")}
  `),

  "04-sprint-3-4": svg(`
  ${header("Sprint 3 ~ 4", "4 / 5")}

  ${sprintPanel(36, 196, 908, 660, "3", "KB · RAG", "8.4 ~ 8.7", C.teal, [
    { who: "이상윤", task: "벡터DB · RAG · 후보/근거/보완질문" },
    { who: "이태우", task: "매핑 품질·응답 방향 검토" },
    { who: "성용준", task: "시나리오 시험 · 오류 유형 기록" },
  ])}

  ${sprintPanel(976, 196, 908, 660, "4", "플랫폼", "8.8 ~ 8.10", C.navy, [
    { who: "이상윤", task: "웹·API · 연동 · 배포 환경" },
    { who: "이태우", task: "시연 범위·화면 흐름 검토" },
    { who: "성용준", task: "E2E 기능 검수 · 오류 테스트" },
  ])}

  <g filter="url(#shadow)">
    <rect x="36" y="880" width="908" height="148" rx="16" fill="#f0fdfa" stroke="#99f6e4"/>
    ${t(64, 970, 26, 700, C.teal, "완료 (S3)  ·  후보·근거·보완질문 출력")}
  </g>
  <g filter="url(#shadow)">
    <rect x="976" y="880" width="908" height="148" rx="16" fill="#eff6ff" stroke="#93c5fd"/>
    ${t(1004, 970, 26, 700, C.navy, "완료 (S4)  ·  핵심 플로우 시연 가능")}
  </g>

  ${footer("산출: RAG 엔진 · API · 기본 웹 · 시연 스크립트")}
  `),

  "05-sprint-5-acceptance": svg(`
  ${header("Sprint 5 · 검수", "5 / 5")}

  ${sprintPanel(36, 196, 908, 620, "5", "시험·검수", "8.11 ~ 8.13", C.blue, [
    { who: "성용준", task: "기능 검수 · 오류 테스트 총괄" },
    { who: "이상윤", task: "오류 보정 · 재시험 · 완료보고" },
    { who: "이태우", task: "검수 진행·인수 방향 확인" },
  ])}

  <g filter="url(#shadow)">
    <rect x="976" y="196" width="908" height="620" rx="18" fill="#fff" stroke="#cbd5e1"/>
    ${t(1016, 270, 36, 700, C.text, "검수 체크")}
    ${t(1016, 360, 28, 700, C.muted, "☐ 입력 · 검색 · 추천결과")}
    ${t(1016, 450, 28, 700, C.muted, "☐ 보완질문 · 시험 실행")}
    ${t(1016, 540, 28, 700, C.muted, "☐ KSIC 후보 · 설계 방향")}
    ${t(1016, 630, 28, 700, C.muted, "☐ 테스트 20건 이상")}
    ${t(1016, 720, 28, 700, C.muted, "☐ 3개월 무상 하자보수")}
  </g>

  <g filter="url(#shadow)">
    <rect x="36" y="840" width="1848" height="180" rx="18" fill="#fff" stroke="#cbd5e1"/>
    ${t(64, 910, 34, 700, C.text, "품질 · 보안 · 이슈")}
    ${t(64, 980, 24, 700, C.muted, "기능확인 → RAG점검 → 보정  ·  권한·마스킹  ·  발주자 협의")}
  </g>

  ${footer("개발총괄 이상윤 · 기능 검수 성용준 · PM 이태우  ·  발주자 보고용")}
  `),
};

for (const name of readdirSync(outDir)) {
  if (name.endsWith(".svg")) unlinkSync(join(outDir, name));
}

for (const [name, content] of Object.entries(diagrams)) {
  const resvg = new Resvg(content, {
    fitTo: { mode: "width", value: W },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "Malgun Gothic",
    },
  });
  const png = resvg.render().asPng();
  writeFileSync(join(outDir, `${name}.png`), png);
  console.log("PNG", name, `${W}x${H}`, png.length);
}

writeFileSync(
  join(outDir, "README.md"),
  `# 스프린트 플래닝 (발주자용 PNG)

## 역할
| 담당 | 역할 | 주요 책임 |
|------|------|-----------|
| 이태우 | PM | 프로젝트 진행 검토 · 개발 방향 조정 |
| 이상윤 | 개발총괄 | 요구분석·범위·Sprint·설계·FE/BE·DB·배포·테스트·검수 대응 |
| 성용준 | 기능 검수 | 시스템 기능 검수 · 오류 테스트 |

재생성: \`node scripts/generate-sprint-planning-pngs.mjs\`
`,
  "utf8",
);

console.log("Done →", outDir);
