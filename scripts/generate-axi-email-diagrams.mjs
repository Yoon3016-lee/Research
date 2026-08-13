/**
 * AXI · 이메일 발송 — 비전공자용 발표 다이어그램
 * Run: node scripts/generate-axi-email-diagrams.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
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
  .num { font: 700 14px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .foot { font: 500 12px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #64748b; }
  .badge { font: 700 13px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #fff; }
  .big { font: 700 18px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #0f172a; }
  .callout { font: 600 14px 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif; fill: #0f766e; }
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
    <marker id="arrBlue" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="#1e3a5f"/>
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

/** 단계 카드: x,y,w,h, num, title, line1, line2, color */
function stepCard(x, y, w, h, num, title, line1, line2, color) {
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fff" stroke="#cbd5e1"/>
    <circle cx="${x + 28}" cy="${y + 28}" r="18" fill="${color}"/>
    <text x="${x + 28}" y="${y + 34}" class="num" text-anchor="middle">${num}</text>
    <text x="${x + 56}" y="${y + 34}" class="h">${title}</text>
    <text x="${x + 24}" y="${y + 68}" class="p">${line1}</text>
    <text x="${x + 24}" y="${y + 90}" class="p">${line2}</text>
  </g>`;
}

const diagrams = {
  "05-axi-how-it-works": svg(`
  <text x="72" y="56" class="title">AXI가 답을 만드는 방법</text>
  <text x="72" y="86" class="subtitle">직원이 질문하면 → 규칙 안내문 + AI → 짧은 한국어 답변으로 화면에 표시</text>

  ${stepCard(72, 130, 280, 110, "1", "질문 입력", "직원이 AXI 창에", "궁금한 점을 적습니다", "#0f766e")}
  <line x1="368" y1="185" x2="408" y2="185" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arr)"/>
  ${stepCard(420, 130, 300, 110, "2", "안내 규칙 준비", "“짧고 친절하게 답하라”", "같은 규칙을 AI에게 전달", "#0f766e")}
  <line x1="736" y1="185" x2="776" y2="185" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arr)"/>
  ${stepCard(788, 130, 320, 110, "3", "상황 정보 붙이기", "지금 어떤 화면인지", "(홈 / 설문) 정보를 함께", "#1e3a5f")}
  <line x1="1124" y1="185" x2="1164" y2="185" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arr)"/>
  ${stepCard(1176, 130, 352, 110, "4", "AI에게 요청", "OpenAI 또는 Gemini", "설정된 모델을 호출", "#7c2d12")}

  <line x1="1352" y1="240" x2="1352" y2="290" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arr)"/>

  <g filter="url(#shadow)">
    <rect x="72" y="300" width="1456" height="200" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="300" width="1456" height="44" rx="18" fill="#134e4a"/>
    <rect x="72" y="328" width="1456" height="16" fill="#134e4a"/>
    <text x="96" y="328" class="layer">AI가 받은 내용 (쉬운 비유: 시험 문제지)</text>

    <rect x="100" y="368" width="420" height="110" rx="12" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="120" y="400" class="h">① 역할 안내 (시스템)</text>
    <text x="120" y="426" class="p">“당신은 조사 안내 도우미”</text>
    <text x="120" y="448" class="p">“1~2문장만, 목록 금지”</text>

    <rect x="548" y="368" width="480" height="110" rx="12" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="568" y="400" class="h">② 상황 + 직원 질문</text>
    <text x="568" y="426" class="p">홈이면: 일반 이용 안내</text>
    <text x="568" y="448" class="p">설문이면: 업종·문항·스크립트 포함</text>

    <rect x="1056" y="368" width="440" height="110" rx="12" fill="#fff7ed" stroke="#fed7aa"/>
    <text x="1076" y="400" class="h">③ AI 답 → 다듬기</text>
    <text x="1076" y="426" class="p">긴 답·기호를 정리하고</text>
    <text x="1076" y="448" class="p">짧은 문장만 채팅에 표시</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="72" y="540" width="700" height="240" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="540" width="700" height="44" rx="18" fill="#0f766e"/>
    <rect x="72" y="568" width="700" height="16" fill="#0f766e"/>
    <text x="96" y="568" class="layer">한 줄로 기억하기</text>
    <text x="100" y="630" class="big">AXI = 안내 챗봇</text>
    <text x="100" y="668" class="p">직접 답을 “지어내는” 관리자가 아니라,</text>
    <text x="100" y="694" class="p">미리 정한 규칙과 설문 정보를 AI에 넘기고</text>
    <text x="100" y="720" class="p">받은 답을 짧게 정리해 보여 줍니다.</text>
    <text x="100" y="754" class="callout">※ 법무·의료 등 범위를 벗어나면 거절 문구만 표시</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="812" y="540" width="716" height="240" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="812" y="540" width="716" height="44" rx="18" fill="#1e3a5f"/>
    <rect x="812" y="568" width="716" height="16" fill="#1e3a5f"/>
    <text x="836" y="568" class="layer">화면에는 이렇게 보입니다</text>
    <rect x="848" y="612" width="640" height="48" rx="12" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="868" y="642" class="p">직원: “이 보기 뜻이 뭐예요?”</text>
    <rect x="848" y="680" width="640" height="64" rx="12" fill="#ecfdf5" stroke="#6ee7b7"/>
    <text x="868" y="710" class="p">AXI: “해당 보기는 …를 의미합니다.</text>
    <text x="868" y="732" class="p">응답자에게는 …라고 설명해 주세요.”</text>
  </g>

  <text x="72" y="860" class="foot">research-a · 발표용 05 · 비전공자용 · 상세는 내부-흐름도-AXI-이메일.md</text>
`),

  "06-axi-home-vs-survey": svg(`
  <text x="72" y="56" class="title">홈페이지 vs 설문 진행 중 — AXI가 아는 정보</text>
  <text x="72" y="86" class="subtitle">같은 챗봇이지만, 설문 화면에 들어가면 “이 설문의 업종·문항”을 함께 봅니다</text>

  <g filter="url(#shadow)">
    <rect x="72" y="120" width="700" height="520" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="120" width="700" height="56" rx="18" fill="#64748b"/>
    <rect x="72" y="156" width="700" height="20" fill="#64748b"/>
    <text x="420" y="156" class="badge" text-anchor="middle" style="font-size:18px">공개 홈 · 일반 페이지</text>

    <circle cx="140" cy="240" r="22" fill="#64748b"/><text x="140" y="246" class="num" text-anchor="middle">1</text>
    <text x="180" y="238" class="h">직원이 홈에서 AXI를 엽니다</text>
    <text x="180" y="262" class="p">사이트 이용·조사 용어 일반 안내</text>

    <circle cx="140" cy="340" r="22" fill="#64748b"/><text x="140" y="346" class="num" text-anchor="middle">2</text>
    <text x="180" y="338" class="h">업종(KSIC) 정보는 안 붙습니다</text>
    <text x="180" y="362" class="p">특정 설문을 보고 있지 않기 때문</text>

    <circle cx="140" cy="440" r="22" fill="#64748b"/><text x="140" y="446" class="num" text-anchor="middle">3</text>
    <text x="180" y="438" class="h">보편적인 안내만 가능</text>
    <text x="180" y="462" class="p">“이 설문 업종이 뭐야?” → 특정 코드 모름</text>

    <rect x="120" y="520" width="600" height="90" rx="12" fill="#f8fafc" stroke="#cbd5e1"/>
    <text x="140" y="558" class="h">비유</text>
    <text x="140" y="586" class="p">로비 안내원 — 건물 이용법은 알지만, 회의실 안 서류는 모름</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="828" y="120" width="700" height="520" rx="18" fill="#fff" stroke="#0f766e" stroke-width="2"/>
    <rect x="828" y="120" width="700" height="56" rx="18" fill="#0f766e"/>
    <rect x="828" y="156" width="700" height="20" fill="#0f766e"/>
    <text x="1178" y="156" class="badge" text-anchor="middle" style="font-size:18px">설문 진행 화면</text>

    <circle cx="896" cy="240" r="22" fill="#0f766e"/><text x="896" y="246" class="num" text-anchor="middle">1</text>
    <text x="936" y="238" class="h">설문 페이지에 들어가면</text>
    <text x="936" y="262" class="p">제목 · 문항 · 응답 스크립트가 준비됩니다</text>

    <circle cx="896" cy="340" r="22" fill="#0f766e"/><text x="896" y="346" class="num" text-anchor="middle">2</text>
    <text x="936" y="338" class="h">업종 코드(KSIC)를 읽어 옵니다</text>
    <text x="936" y="362" class="p">관리자가 설문에 넣어 둔 산업분류 → 설명 문장으로 변환</text>

    <circle cx="896" cy="440" r="22" fill="#0f766e"/><text x="896" y="446" class="num" text-anchor="middle">3</text>
    <text x="936" y="438" class="h">그 설문에 맞는 안내</text>
    <text x="936" y="462" class="p">보기 뜻·멘트·업종 맥락을 반영해 답변</text>

    <rect x="876" y="520" width="600" height="90" rx="12" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="896" y="558" class="h">비유</text>
    <text x="896" y="586" class="p">회의실 안 도우미 — 책상 위 자료(업종·문항)를 보고 설명</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="72" y="670" width="1456" height="120" rx="16" fill="#fffbeb" stroke="#fcd34d"/>
    <text x="100" y="714" class="h">KSIC를 “인식”한다는 뜻</text>
    <text x="100" y="744" class="p">화면을 사진처럼 읽는 것이 아닙니다. 설문에 저장된 업종 코드를 DB에서 찾아 설명 글로 만든 뒤, 질문과 함께 AI에게 넘깁니다.</text>
    <text x="100" y="770" class="p">설문 화면을 벗어나면 그 정보는 다시 꺼지고, 홈 안내 모드로 돌아갑니다.</text>
  </g>

  <text x="72" y="860" class="foot">research-a · 발표용 06 · 비전공자용 · KSIC = 표준산업분류(업종 코드)</text>
`),

  "07-email-how-it-works": svg(`
  <text x="72" y="56" class="title">설문 안내 이메일이 나가는 방법</text>
  <text x="72" y="86" class="subtitle">관리자가 쓴 편지 초안 → 사람마다 이름·링크 바꾸기 → 후이즈 메일로 발송</text>

  ${stepCard(72, 130, 260, 120, "1", "편지 초안 작성", "평문으로 제목·본문", "작성 (HTML 불필요)", "#0f766e")}
  <line x1="348" y1="190" x2="388" y2="190" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arr)"/>
  ${stepCard(400, 130, 280, 120, "2", "사람마다 채우기", "(OOO님) → (김○○님)", "{{링크}} → 개인 설문 URL", "#0f766e")}
  <line x1="696" y1="190" x2="736" y2="190" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arr)"/>
  ${stepCard(748, 130, 280, 120, "3", "읽기 쉽게 변환", "평문 + 클릭 가능한", "링크 HTML을 함께 생성", "#1e3a5f")}
  <line x1="1044" y1="190" x2="1084" y2="190" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#arr)"/>
  ${stepCard(1096, 130, 432, 120, "4", "후이즈로 보내기", "회사 웹메일 SMTP로 전송", "성공·실패를 목록에 기록", "#7c2d12")}

  <g filter="url(#shadow)">
    <rect x="72" y="290" width="720" height="340" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="290" width="720" height="48" rx="18" fill="#0f766e"/>
    <rect x="72" y="318" width="720" height="20" fill="#0f766e"/>
    <text x="96" y="320" class="layer">초안에 넣을 수 있는 자리표시</text>
    <text x="100" y="380" class="h">(OOO님)</text>
    <text x="280" y="380" class="p">→ 표본 이름열 값으로 바뀜 (없으면 빈 괄호)</text>
    <text x="100" y="420" class="h">{{링크}}</text>
    <text x="280" y="420" class="p">→ 그 사람만의 설문 참여 주소</text>
    <text x="100" y="460" class="h">{{UID}}</text>
    <text x="280" y="460" class="p">→ 표본 고유번호</text>
    <text x="100" y="500" class="h">{{이름}} · {{열이름}}</text>
    <text x="340" y="500" class="p">→ 엑셀에 올려 둔 열 값</text>
    <rect x="100" y="540" width="660" height="60" rx="12" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="120" y="576" class="p">미리보기와 실제 발송은 같은 방식으로 채워집니다</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="828" y="290" width="700" height="340" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="828" y="290" width="700" height="48" rx="18" fill="#1e3a5f"/>
    <rect x="828" y="318" width="700" height="20" fill="#1e3a5f"/>
    <text x="852" y="320" class="layer">받는 사람이 하는 일</text>
    <circle cx="900" cy="390" r="18" fill="#1e3a5f"/><text x="900" y="396" class="num" text-anchor="middle">1</text>
    <text x="936" y="388" class="h">메일함에서 안내 메일 수신</text>
    <text x="936" y="412" class="p">발신: 설정된 조사 안내 주소</text>
    <circle cx="900" cy="470" r="18" fill="#1e3a5f"/><text x="900" y="476" class="num" text-anchor="middle">2</text>
    <text x="936" y="468" class="h">본문 링크 클릭</text>
    <text x="936" y="492" class="p">개인 초대 주소로 설문 화면 이동</text>
    <circle cx="900" cy="550" r="18" fill="#1e3a5f"/><text x="900" y="556" class="num" text-anchor="middle">3</text>
    <text x="936" y="548" class="h">설문 응답 · 완료</text>
    <text x="936" y="572" class="p">관리자 목록에 응답·소요시간 반영</text>
    <text x="860" y="610" class="callout">링크는 AI가 만든 것이 아니라, 미리 발급한 초대 주소입니다</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="72" y="660" width="1456" height="120" rx="16" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="100" y="708" class="h">테스트 발송 vs 일괄 발송</text>
    <text x="100" y="740" class="p">테스트: 고른 1명에게만 보냄 (연습용) · 일괄: 아직 안 보낸 사람들부터 순서대로 보냄 · 보낸 사람은 다시 보내지 않음</text>
    <text x="100" y="766" class="p">첫 일괄 성공 후에는 표본 명단을 함부로 바꾸지 못하도록 잠글 수 있습니다.</text>
  </g>

  <text x="72" y="860" class="foot">research-a · 발표용 07 · 비전공자용 · 전송 채널 = 후이즈 웹메일(SMTP)</text>
`),

  "08-email-safety-limits": svg(`
  <text x="72" y="56" class="title">이메일을 안전하게 보내는 규칙</text>
  <text x="72" y="86" class="subtitle">후이즈 메일 한도를 넘지 않도록, 천천히 · 나눠서 보냅니다</text>

  <g filter="url(#shadow)">
    <rect x="72" y="130" width="460" height="280" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="130" width="460" height="52" rx="18" fill="#0f766e"/>
    <rect x="72" y="162" width="460" height="20" fill="#0f766e"/>
    <text x="302" y="164" class="badge" text-anchor="middle" style="font-size:16px">규칙 ① 천천히</text>
    <text x="110" y="240" class="big">1초에 1통</text>
    <text x="110" y="280" class="p">한꺼번에 수백 통을 쏘지 않고</text>
    <text x="110" y="308" class="p">한 명 보내고 → 잠깐 쉬고 → 다음</text>
    <text x="110" y="350" class="small">서버가 메일 업체에 부담을 주지 않게</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="570" y="130" width="460" height="280" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="570" y="130" width="460" height="52" rx="18" fill="#1e3a5f"/>
    <rect x="570" y="162" width="460" height="20" fill="#1e3a5f"/>
    <text x="800" y="164" class="badge" text-anchor="middle" style="font-size:16px">규칙 ② 나눠서</text>
    <text x="608" y="240" class="big">한 번에 최대 약 400통</text>
    <text x="608" y="280" class="p">남은 사람은 다음 실행에서</text>
    <text x="608" y="308" class="p">이어서 발송 (이미 보낸 사람은 제외)</text>
    <text x="608" y="350" class="small">끊겨도 보낸 기록은 남고, 나머지만 재시도</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="1068" y="130" width="460" height="280" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="1068" y="130" width="460" height="52" rx="18" fill="#9a3412"/>
    <rect x="1068" y="162" width="460" height="20" fill="#9a3412"/>
    <text x="1298" y="164" class="badge" text-anchor="middle" style="font-size:16px">규칙 ③ 식히기</text>
    <text x="1106" y="240" class="big">배치 후 잠깐 대기</text>
    <text x="1106" y="280" class="p">한도를 채우면 잠시 후</text>
    <text x="1106" y="308" class="p">다시 “일괄 발송”을 누릅니다</text>
    <text x="1106" y="350" class="small">운영 시에는 약 10분 대기가 안전</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="72" y="450" width="1456" height="280" rx="18" fill="#fff" stroke="#cbd5e1"/>
    <rect x="72" y="450" width="1456" height="48" rx="18" fill="#0f172a"/>
    <rect x="72" y="478" width="1456" height="20" fill="#0f172a"/>
    <text x="96" y="480" class="layer">관리자 화면에 남는 것</text>

    <rect x="100" y="530" width="320" height="160" rx="14" fill="#f0fdfa" stroke="#99f6e4"/>
    <text x="120" y="570" class="h">발송 상태</text>
    <text x="120" y="600" class="p">미발송 / 발송완료 / 실패</text>
    <text x="120" y="628" class="p">실패 시 사유 문구</text>

    <rect x="448" y="530" width="320" height="160" rx="14" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="468" y="570" class="h">발송 이력</text>
    <text x="468" y="600" class="p">누구에게 · 언제 · 무슨 내용</text>
    <text x="468" y="628" class="p">테스트 / 일괄 구분</text>

    <rect x="796" y="530" width="320" height="160" rx="14" fill="#fff7ed" stroke="#fed7aa"/>
    <text x="816" y="570" class="h">응답 결과</text>
    <text x="816" y="600" class="p">응답했는지 · 언제</text>
    <text x="816" y="628" class="p">설문 소요시간</text>

    <rect x="1144" y="530" width="352" height="160" rx="14" fill="#fef2f2" stroke="#fecaca"/>
    <text x="1164" y="570" class="h">엑셀로 내려받기</text>
    <text x="1164" y="600" class="p">발송·응답 현황을</text>
    <text x="1164" y="628" class="p">표로 저장 가능</text>
  </g>

  <text x="72" y="860" class="foot">research-a · 발표용 08 · 비전공자용 · 후이즈 한도(대략 10분 500통)보다 여유 있게 설계</text>
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
  writeFileSync(join(outDir, `${name}.png`), png);
  console.log("OK", name, "svg+png", png.length);
}

// README에 행 추가 (기존 01–04 유지)
const readmePath = join(outDir, "README.md");
let readme = "";
try {
  readme = readFileSync(readmePath, "utf8");
} catch {
  readme = `# 발표용 구조·흐름도\n\nPPT에 **PNG**를 삽입하세요 (16:9, 1920px 폭). SVG는 편집·재생성용입니다.\n\n`;
}

if (!readme.includes("05-axi-how-it-works.png")) {
  const extra = `
| \`05-axi-how-it-works.png\` | AXI가 답을 만드는 방법 (비전공자용) |
| \`06-axi-home-vs-survey.png\` | 홈 vs 설문 · KSIC 인식 (비전공자용) |
| \`07-email-how-it-works.png\` | 이메일 발송 방법 (비전공자용) |
| \`08-email-safety-limits.png\` | 이메일 안전 발송 규칙 (비전공자용) |

AXI·이메일 그림만 재생성: \`node scripts/generate-axi-email-diagrams.mjs\`
`;
  if (readme.includes("재생성:")) {
    readme = readme.replace(
      /재생성: `node scripts\/generate-presentation-diagrams\.mjs`/,
      `| \`05-axi-how-it-works.png\` | AXI가 답을 만드는 방법 (비전공자용) |\n| \`06-axi-home-vs-survey.png\` | 홈 vs 설문 · KSIC 인식 (비전공자용) |\n| \`07-email-how-it-works.png\` | 이메일 발송 방법 (비전공자용) |\n| \`08-email-safety-limits.png\` | 이메일 안전 발송 규칙 (비전공자용) |\n\n재생성(01–04): \`node scripts/generate-presentation-diagrams.mjs\`  \n재생성(05–08): \`node scripts/generate-axi-email-diagrams.mjs\``,
    );
  } else {
    readme += extra;
  }
  writeFileSync(readmePath, readme, "utf8");
}

console.log("Done →", outDir);
