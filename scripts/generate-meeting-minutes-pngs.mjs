/**
 * 중간 회의록 4장 (발주자용 PNG)
 * Run: node scripts/generate-meeting-minutes-pngs.mjs
 *
 * 출력: docs/meeting-minutes/*.png (1920×1080)
 */
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Resvg } = require("@resvg/resvg-js");

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "meeting-minutes");
mkdirSync(outDir, { recursive: true });

const W = 1920;
const H = 1080;
const FONT = "Malgun Gothic, Apple SD Gothic Neo, sans-serif";

const C = {
  navy: "#1e3a5f",
  teal: "#0f766e",
  amber: "#b45309",
  blue: "#1d4ed8",
  text: "#0f172a",
  muted: "#334155",
  soft: "#64748b",
  white: "#ffffff",
  whiteMuted: "#e2e8f0",
  reqBg: "#fff7ed",
  reqBorder: "#fdba74",
  dirBg: "#eff6ff",
  dirBorder: "#93c5fd",
  agrBg: "#f0fdfa",
  agrBorder: "#99f6e4",
};

function t(x, y, size, weight, fill, content, anchor = "start") {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${content}</text>`;
}

function lines(x, startY, size, weight, fill, texts, gap = 42) {
  return texts.map((line, i) => t(x, startY + i * gap, size, weight, fill, line)).join("\n");
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

function header(n, topic, date, page) {
  return `
  <rect x="0" y="0" width="${W}" height="88" fill="url(#nav)"/>
  ${t(40, 56, 30, 700, C.white, "1단계 외주용역 · 중간 회의록")}
  ${t(W - 40, 56, 26, 600, C.whiteMuted, `${page} / 4`, "end")}
  ${t(40, 160, 56, 700, C.text, `${n}차 회의록`)}
  ${t(40, 214, 28, 600, C.soft, `${date}  ·  ${topic}`)}
  ${t(40, 258, 22, 600, C.soft, "참석: 발주자(프라임에이엑스) · PM 이태우 · 개발총괄 이상윤 · 기능 검수 성용준")}`;
}

function section(x, y, w, h, title, accent, bg, border, bodyLines) {
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="${x}" y="${y}" width="14" height="${h}" fill="${accent}"/>
    <rect x="${x + 28}" y="${y + 24}" width="220" height="48" rx="24" fill="${bg}" stroke="${border}"/>
    ${t(x + 138, y + 57, 26, 700, accent, title, "middle")}
    ${lines(x + 36, y + 110, 28, 600, C.muted, bodyLines, 40)}
  </g>`;
}

function footer(note) {
  return t(40, H - 22, 22, 600, C.soft, note);
}

const meetings = [
  {
    file: "01-meeting-ksic-verify",
    n: 1,
    date: "2026. 8. 1.",
    topic: "KSIC 코드 신뢰성 · 외부 데이터 검증",
    req: [
      "현재 KSIC가 정적 DB에만 적재되어 있어",
      "최신 분류·명칭과의 일치 여부를 확인하기 어렵다.",
      "외부 공신력 있는 기준으로 검증할 수 있어야 한다.",
    ],
    dir: [
      "개발총괄: K-SURE 공개 KSIC를 가져와 내부 적재본과 대조·보정.",
      "PM: 검증 주기·우선 범위 등 진행 방향을 조정한다.",
      "기능 검수: 불일치 목록·보정 결과의 오류 여부를 확인한다.",
    ],
    agr: [
      "외부 KSIC 가져오기 → 대조 → 불일치 보정 흐름으로 확정.",
      "검증 로그·대조 결과를 검수 자료에 포함한다.",
      "정적 DB는 운영 캐시로 유지하되, 신뢰 근거는 외부 검증에 둔다.",
    ],
  },
  {
    file: "02-meeting-axi-ksic",
    n: 2,
    date: "2026. 8. 5.",
    topic: "AXI 챗봇 · 설문 KSIC 인식·전문 응답",
    req: [
      "AXI 챗봇이 설문 맥락의 KSIC를 인식하지 못하면",
      "일반론 답변에 그쳐 조사·설계 도움의 전문성이 부족하다.",
      "응답에 해당 업종·조사 맥락이 반영되어야 한다.",
    ],
    dir: [
      "개발총괄: 설문 KSIC·문항 맥락을 AXI 컨텍스트·프롬프트에 연동.",
      "PM: 홈 문의와 설문 중 도움의 응답 톤·범위를 조정한다.",
      "기능 검수: KSIC 반영 답변·업종 용어 사용을 시험한다.",
    ],
    agr: [
      "설문 진행 중 AXI는 KSIC·설문 맥락을 반영해 답변한다.",
      "근거·보완 안내는 해당 업종 용어를 우선 사용한다.",
      "다음 스프린트에서 설문 연동·프롬프트 보정을 반영한다.",
    ],
  },
  {
    file: "03-meeting-excel-format",
    n: 3,
    date: "2026. 8. 8.",
    topic: "응답 분석 Excel 형식 변경",
    req: [
      "기존 내보내기 시트가 실무 정리·보고에 맞지 않는다.",
      "발주자 제공 양식(안내·문항정의·응답_코드·정리·요약)으로",
      "열 구성·병합·선택 번호 표기를 맞춰 달라.",
    ],
    dir: [
      "개발총괄: 요청 양식 기준 시트·열·번호 표기 로직을 반영.",
      "PM: 실무 보고 관점에서 시트 구성·우선순위를 검토한다.",
      "기능 검수: 내보내기 샘플로 형식·누락·오류를 확인한다.",
    ],
    agr: [
      "요청 양식 기준으로 내보내기 로직을 전면 반영한다.",
      "중도중단 초안은 제외하고 완료 응답만 포함한다.",
      "표본·이메일 완료분은 UID/응답N 식별자를 유지한다.",
    ],
  },
  {
    file: "04-meeting-cati-uid",
    n: 4,
    date: "2026. 8. 11.",
    topic: "UID 표본 · CATI 전화조사 진행",
    req: [
      "직원이 CATI로 전화조사를 진행할 수 있어야 한다.",
      "표본에 UID를 적용해 대상자를 특정하고,",
      "통화·컨택 결과와 설문 응답을 연결해 기록해야 한다.",
    ],
    dir: [
      "개발총괄: UID 적용·설문·컨택 기록·이어하기 흐름을 구현.",
      "PM: 직원 조사 절차·권한 범위 등 운영 방향을 조정한다.",
      "기능 검수: UID 적용부터 응답 저장까지 오류 테스트를 수행.",
    ],
    agr: [
      "직원 로그인·권한 하에서만 CATI 표본 조사를 허용한다.",
      "UID 적용 → 조사 → 결과 기록 → 다음 표본 순으로 확정.",
      "응답은 표본(sample)과 연결되어 분석·내보내기에 포함된다.",
    ],
  },
];

const diagrams = {};

for (const m of meetings) {
  diagrams[m.file] = svg(`
  ${header(m.n, m.topic, m.date, m.n)}

  ${section(40, 290, 1840, 220, "발주자 요구사항", C.amber, C.reqBg, C.reqBorder, m.req)}
  ${section(40, 530, 1840, 220, "개발팀 진행방향", C.blue, C.dirBg, C.dirBorder, m.dir)}
  ${section(40, 770, 1840, 240, "합의 결과", C.teal, C.agrBg, C.agrBorder, m.agr)}

  ${footer("프라임에이엑스 × PM 이태우 · 개발총괄 이상윤 · 기능 검수 성용준  ·  수행계획서 첨부용")}
  `);
}

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
  console.log("PNG", name, png.length);
}

writeFileSync(
  join(outDir, "README.md"),
  `# 중간 회의록 (발주자용 PNG)

| 파일 | 내용 |
|------|------|
| \`01-meeting-ksic-verify.png\` | 1차 · KSIC 외부 검증 |
| \`02-meeting-axi-ksic.png\` | 2차 · AXI 설문 KSIC 인식 |
| \`03-meeting-excel-format.png\` | 3차 · 응답 Excel 형식 |
| \`04-meeting-cati-uid.png\` | 4차 · UID·CATI 조사 |

재생성: \`node scripts/generate-meeting-minutes-pngs.mjs\`
`,
  "utf8",
);

console.log("Done →", outDir);
