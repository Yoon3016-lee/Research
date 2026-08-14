/**
 * 스프린트 플래닝 · 회의록 — 편집 가능한 텍스트 PPTX
 * Run: node scripts/generate-docs-pptx.mjs
 *
 * PNG가 아니라 pptxgenjs 텍스트/도형으로 작성 → 복사·수정 가능
 */
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const W = 13.333;
const H = 7.5;

const C = {
  navy: "1E3A5F",
  teal: "0F766E",
  slate: "475569",
  amber: "B45309",
  blue: "1D4ED8",
  text: "0F172A",
  muted: "334155",
  soft: "64748B",
  white: "FFFFFF",
  bg: "F1F5F9",
  card: "FFFFFF",
  line: "CBD5E1",
};

function newPptx(title) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE_16x9", width: W, height: H });
  pptx.layout = "WIDE_16x9";
  pptx.author = "Research Hub";
  pptx.title = title;
  return pptx;
}

function addNav(slide, pageLabel) {
  slide.background = { color: C.bg };
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: W,
    h: 0.55,
    fill: { color: C.navy },
    line: { color: C.navy },
  });
  slide.addText("1단계 외주용역 · 스프린트 플래닝", {
    x: 0.35,
    y: 0.12,
    w: 10,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: C.white,
    fontFace: "Malgun Gothic",
  });
  slide.addText(pageLabel, {
    x: 11.5,
    y: 0.12,
    w: 1.5,
    h: 0.35,
    fontSize: 14,
    color: "E2E8F0",
    align: "right",
    fontFace: "Malgun Gothic",
  });
}

function addNavMeeting(slide, pageLabel) {
  slide.background = { color: C.bg };
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: W,
    h: 0.55,
    fill: { color: C.navy },
    line: { color: C.navy },
  });
  slide.addText("1단계 외주용역 · 중간 회의록", {
    x: 0.35,
    y: 0.12,
    w: 10,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: C.white,
    fontFace: "Malgun Gothic",
  });
  slide.addText(pageLabel, {
    x: 11.5,
    y: 0.12,
    w: 1.5,
    h: 0.35,
    fontSize: 14,
    color: "E2E8F0",
    align: "right",
    fontFace: "Malgun Gothic",
  });
}

function card(slide, x, y, w, h, accent) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    fill: { color: C.card },
    line: { color: C.line },
    rectRadius: 0.1,
  });
  slide.addShape("rect", {
    x,
    y,
    w: 0.08,
    h,
    fill: { color: accent },
    line: { color: accent },
  });
}

function footer(slide, text) {
  slide.addText(text, {
    x: 0.35,
    y: H - 0.35,
    w: 12.6,
    h: 0.28,
    fontSize: 12,
    color: C.soft,
    fontFace: "Malgun Gothic",
  });
}

/** —— 스프린트 플래닝 —— */
function buildSprintPptx() {
  const pptx = newPptx("스프린트 플래닝");

  // 1. 수행 개요 · 역할
  {
    const s = pptx.addSlide();
    addNav(s, "1 / 5");
    s.addText("수행 개요 · 역할", {
      x: 0.35,
      y: 0.7,
      w: 12,
      h: 0.45,
      fontSize: 28,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    s.addShape("roundRect", {
      x: 0.35,
      y: 1.25,
      w: 12.6,
      h: 0.55,
      fill: { color: C.card },
      line: { color: C.line },
      rectRadius: 0.08,
    });
    s.addText("KSIC·리서치 구조화 → RAG 매핑 · 내부 검증용 기본 플랫폼 구축", {
      x: 0.55,
      y: 1.35,
      w: 12.2,
      h: 0.35,
      fontSize: 15,
      color: C.muted,
      fontFace: "Malgun Gothic",
    });

    const roles = [
      {
        x: 0.35,
        w: 2.9,
        name: "이태우",
        role: "PM",
        color: C.navy,
        lines: ["• 프로젝트 진행 검토", "• 개발 방향 조정"],
      },
      {
        x: 3.45,
        w: 6.4,
        name: "이상윤",
        role: "개발총괄",
        color: C.teal,
        lines: [
          "• 요구사항 분석 · 범위 관리 · Sprint·일정",
          "• 시스템 설계 · Front-end / Back-end 개발",
          "• DB · 배포 환경 구축 · 테스트·검수 대응",
        ],
      },
      {
        x: 10.05,
        w: 2.9,
        name: "성용준",
        role: "기능 검수",
        color: C.amber,
        lines: ["• 시스템 기능 검수", "• 오류 테스트"],
      },
    ];
    for (const r of roles) {
      card(s, r.x, 2.0, r.w, 2.7, r.color);
      s.addText(r.name, {
        x: r.x + 0.25,
        y: 2.15,
        w: r.w - 0.4,
        h: 0.4,
        fontSize: 22,
        bold: true,
        color: C.text,
        fontFace: "Malgun Gothic",
      });
      s.addShape("roundRect", {
        x: r.x + 0.25,
        y: 2.6,
        w: 1.6,
        h: 0.35,
        fill: { color: r.color },
        line: { color: r.color },
        rectRadius: 0.15,
      });
      s.addText(r.role, {
        x: r.x + 0.25,
        y: 2.62,
        w: 1.6,
        h: 0.32,
        fontSize: 13,
        bold: true,
        color: C.white,
        align: "center",
        fontFace: "Malgun Gothic",
      });
      s.addText(r.lines.join("\n"), {
        x: r.x + 0.25,
        y: 3.15,
        w: r.w - 0.45,
        h: 1.4,
        fontSize: 14,
        color: C.muted,
        fontFace: "Malgun Gothic",
        valign: "top",
      });
    }

    card(s, 0.35, 4.9, 12.6, 2.1, C.slate);
    s.addText("추진 단계", {
      x: 0.55,
      y: 5.05,
      w: 4,
      h: 0.35,
      fontSize: 18,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    const phases = [
      { x: 0.55, title: "1. 착수·설계", sub: "7.27~7.30 · 요구·검수 확정", bg: "F0FDFA", tc: C.teal },
      { x: 4.7, title: "2. 개발·구현", sub: "7.31~8.10 · RAG·API·웹", bg: "EFF6FF", tc: C.navy },
      { x: 8.85, title: "3. 시험·검수", sub: "8.11~8.13 · 테스트·인수", bg: "FFF7ED", tc: C.amber },
    ];
    for (const p of phases) {
      s.addShape("roundRect", {
        x: p.x,
        y: 5.5,
        w: 3.85,
        h: 1.2,
        fill: { color: p.bg },
        line: { color: C.line },
        rectRadius: 0.08,
      });
      s.addText(p.title, {
        x: p.x + 0.2,
        y: 5.7,
        w: 3.4,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: p.tc,
        fontFace: "Malgun Gothic",
      });
      s.addText(p.sub, {
        x: p.x + 0.2,
        y: 6.15,
        w: 3.4,
        h: 0.35,
        fontSize: 13,
        color: C.muted,
        fontFace: "Malgun Gothic",
      });
    }
    footer(s, "기간 2026.7.27 ~ 8.13  ·  발주자 프라임에이엑스 · PM 이태우 · 개발총괄 이상윤 · 기능 검수 성용준");
  }

  // 2. 타임라인
  {
    const s = pptx.addSlide();
    addNav(s, "2 / 5");
    s.addText("스프린트 타임라인", {
      x: 0.35,
      y: 0.7,
      w: 12,
      h: 0.45,
      fontSize: 28,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    const boxes = [
      { title: "착수·설계", date: "7.27~7.30", color: C.slate },
      { title: "데이터", date: "7.31~8.3", color: C.amber },
      { title: "KB·RAG", date: "8.4~8.7", color: C.teal },
      { title: "플랫폼", date: "8.8~8.10", color: C.navy },
      { title: "검수", date: "8.11~8.13", color: C.blue },
    ];
    boxes.forEach((b, i) => {
      const x = 0.35 + i * 2.55;
      s.addShape("roundRect", {
        x,
        y: 1.3,
        w: 2.4,
        h: 1.55,
        fill: { color: C.card },
        line: { color: C.line },
        rectRadius: 0.08,
      });
      s.addShape("rect", {
        x,
        y: 1.3,
        w: 2.4,
        h: 0.45,
        fill: { color: b.color },
        line: { color: b.color },
      });
      s.addText(`S${i + 1}`, {
        x,
        y: 1.35,
        w: 2.4,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: C.white,
        align: "center",
        fontFace: "Malgun Gothic",
      });
      s.addText(b.title, {
        x: x + 0.15,
        y: 1.9,
        w: 2.1,
        h: 0.35,
        fontSize: 16,
        bold: true,
        color: C.text,
        fontFace: "Malgun Gothic",
      });
      s.addText(b.date, {
        x: x + 0.15,
        y: 2.3,
        w: 2.1,
        h: 0.3,
        fontSize: 14,
        color: C.navy,
        fontFace: "Malgun Gothic",
      });
    });

    card(s, 0.35, 3.1, 12.6, 3.85, C.slate);
    s.addText("마일스톤", {
      x: 0.55,
      y: 3.3,
      w: 4,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    const miles = [
      { n: "1", c: C.slate, t: "7.30  요구·검수 기준 확정  ·  이상윤(주) · 이태우 검토" },
      { n: "2", c: C.amber, t: "8.3  KSIC·모듈 적재 완료  ·  이상윤(주) · 성용준 검증" },
      { n: "3", c: C.teal, t: "8.7  RAG 매핑 핵심 동작  ·  이상윤(주) · 이태우 방향 검토" },
      { n: "4", c: C.navy, t: "8.10  기본 플랫폼 E2E  ·  이상윤(주) · 성용준 기능 검수" },
    ];
    miles.forEach((m, i) => {
      const y = 3.9 + i * 0.7;
      s.addShape("ellipse", {
        x: 0.7,
        y: y,
        w: 0.4,
        h: 0.4,
        fill: { color: m.c },
        line: { color: m.c },
      });
      s.addText(m.n, {
        x: 0.7,
        y: y + 0.05,
        w: 0.4,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: C.white,
        align: "center",
        fontFace: "Malgun Gothic",
      });
      s.addText(m.t, {
        x: 1.3,
        y: y + 0.02,
        w: 11.2,
        h: 0.35,
        fontSize: 15,
        color: C.text,
        fontFace: "Malgun Gothic",
      });
    });
    footer(s, "8.13  테스트·최종 검수  ·  이상윤 보정 · 성용준 검수 · 이태우 진행 확인");
  }

  // 3~4. Sprint panels helper
  function addSprintPair(page, title, left, right, leftDone, rightDone, foot) {
    const s = pptx.addSlide();
    addNav(s, page);
    s.addText(title, {
      x: 0.35,
      y: 0.7,
      w: 12,
      h: 0.4,
      fontSize: 28,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });

    function panel(x, data, doneBg, doneColor, doneText) {
      card(s, x, 1.25, 6.2, 4.55, data.color);
      s.addText(`S${data.num}. ${data.title}`, {
        x: x + 0.25,
        y: 1.4,
        w: 5.7,
        h: 0.4,
        fontSize: 20,
        bold: true,
        color: C.text,
        fontFace: "Malgun Gothic",
      });
      s.addText(data.date, {
        x: x + 0.25,
        y: 1.85,
        w: 5.7,
        h: 0.3,
        fontSize: 14,
        color: C.navy,
        fontFace: "Malgun Gothic",
      });
      data.rows.forEach((r, i) => {
        const y = 2.35 + i * 0.95;
        s.addShape("roundRect", {
          x: x + 0.2,
          y,
          w: 5.8,
          h: 0.85,
          fill: { color: "F8FAFC" },
          line: { color: C.line },
          rectRadius: 0.08,
        });
        s.addShape("ellipse", {
          x: x + 0.35,
          y: y + 0.2,
          w: 0.45,
          h: 0.45,
          fill: { color: data.color },
          line: { color: data.color },
        });
        s.addText(r.who[0], {
          x: x + 0.35,
          y: y + 0.27,
          w: 0.45,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: C.white,
          align: "center",
          fontFace: "Malgun Gothic",
        });
        s.addText(r.who, {
          x: x + 1.0,
          y: y + 0.12,
          w: 4.7,
          h: 0.3,
          fontSize: 15,
          bold: true,
          color: C.text,
          fontFace: "Malgun Gothic",
        });
        s.addText(r.task, {
          x: x + 1.0,
          y: y + 0.42,
          w: 4.7,
          h: 0.3,
          fontSize: 13,
          color: C.muted,
          fontFace: "Malgun Gothic",
        });
      });
      s.addShape("roundRect", {
        x,
        y: 5.95,
        w: 6.2,
        h: 0.85,
        fill: { color: doneBg },
        line: { color: C.line },
        rectRadius: 0.08,
      });
      s.addText(doneText, {
        x: x + 0.25,
        y: 6.15,
        w: 5.7,
        h: 0.45,
        fontSize: 14,
        bold: true,
        color: doneColor,
        fontFace: "Malgun Gothic",
        valign: "middle",
      });
    }

    panel(0.35, left, "F8FAFC", left.doneColor || C.teal, leftDone);
    panel(6.8, right, right.doneBg || "FFF7ED", right.doneColor || C.amber, rightDone);
    footer(s, foot);
  }

  addSprintPair(
    "3 / 5",
    "Sprint 1 ~ 2",
    {
      num: 1,
      title: "착수·설계",
      date: "7.27 ~ 7.30",
      color: C.slate,
      rows: [
        { who: "이상윤", task: "요구분석 · 범위 · 설계 · 수행계획" },
        { who: "이태우", task: "진행 검토 · 개발 방향 조정" },
        { who: "성용준", task: "검수 기준 · 테스트 시나리오 초안" },
      ],
    },
    {
      num: 2,
      title: "데이터",
      date: "7.31 ~ 8.3",
      color: C.amber,
      rows: [
        { who: "이상윤", task: "KSIC 구조화 · 모듈 · DB 구축" },
        { who: "이태우", task: "데이터 범위·우선순위 검토" },
        { who: "성용준", task: "적재 결과 · 조회 기능 검증" },
      ],
    },
    "완료 (S1)  ·  범위·검수 기준 합의",
    "완료 (S2)  ·  KSIC·모듈 적재·조회 가능",
    "산출: 요구사항 · 검수표 · KSIC 데이터 · 리서치 모듈",
  );

  addSprintPair(
    "4 / 5",
    "Sprint 3 ~ 4",
    {
      num: 3,
      title: "KB · RAG",
      date: "8.4 ~ 8.7",
      color: C.teal,
      doneColor: C.teal,
      rows: [
        { who: "이상윤", task: "벡터DB · RAG · 후보/근거/보완질문" },
        { who: "이태우", task: "매핑 품질·응답 방향 검토" },
        { who: "성용준", task: "시나리오 시험 · 오류 유형 기록" },
      ],
    },
    {
      num: 4,
      title: "플랫폼",
      date: "8.8 ~ 8.10",
      color: C.navy,
      doneBg: "EFF6FF",
      doneColor: C.navy,
      rows: [
        { who: "이상윤", task: "웹·API · 연동 · 배포 환경" },
        { who: "이태우", task: "시연 범위·화면 흐름 검토" },
        { who: "성용준", task: "E2E 기능 검수 · 오류 테스트" },
      ],
    },
    "완료 (S3)  ·  후보·근거·보완질문 출력",
    "완료 (S4)  ·  핵심 플로우 시연 가능",
    "산출: RAG 엔진 · API · 기본 웹 · 시연 스크립트",
  );

  // 5. Sprint 5
  {
    const s = pptx.addSlide();
    addNav(s, "5 / 5");
    s.addText("Sprint 5 · 검수", {
      x: 0.35,
      y: 0.7,
      w: 12,
      h: 0.4,
      fontSize: 28,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    card(s, 0.35, 1.25, 6.2, 4.3, C.blue);
    s.addText("S5. 시험·검수", {
      x: 0.6,
      y: 1.4,
      w: 5.7,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    s.addText("8.11 ~ 8.13", {
      x: 0.6,
      y: 1.85,
      w: 5.7,
      h: 0.3,
      fontSize: 14,
      color: C.navy,
      fontFace: "Malgun Gothic",
    });
    const rows = [
      { who: "성용준", task: "기능 검수 · 오류 테스트 총괄" },
      { who: "이상윤", task: "오류 보정 · 재시험 · 완료보고" },
      { who: "이태우", task: "검수 진행·인수 방향 확인" },
    ];
    rows.forEach((r, i) => {
      const y = 2.35 + i * 0.95;
      s.addShape("roundRect", {
        x: 0.55,
        y,
        w: 5.8,
        h: 0.85,
        fill: { color: "F8FAFC" },
        line: { color: C.line },
        rectRadius: 0.08,
      });
      s.addShape("ellipse", {
        x: 0.7,
        y: y + 0.2,
        w: 0.45,
        h: 0.45,
        fill: { color: C.blue },
        line: { color: C.blue },
      });
      s.addText(r.who[0], {
        x: 0.7,
        y: y + 0.27,
        w: 0.45,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: C.white,
        align: "center",
        fontFace: "Malgun Gothic",
      });
      s.addText(r.who, {
        x: 1.35,
        y: y + 0.12,
        w: 4.7,
        h: 0.3,
        fontSize: 15,
        bold: true,
        color: C.text,
        fontFace: "Malgun Gothic",
      });
      s.addText(r.task, {
        x: 1.35,
        y: y + 0.42,
        w: 4.7,
        h: 0.3,
        fontSize: 13,
        color: C.muted,
        fontFace: "Malgun Gothic",
      });
    });

    card(s, 6.8, 1.25, 6.2, 4.3, C.navy);
    s.addText("검수 체크", {
      x: 7.1,
      y: 1.5,
      w: 5.5,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    const checks = [
      "☐ 입력 · 검색 · 추천결과",
      "☐ 보완질문 · 시험 실행",
      "☐ KSIC 후보 · 설계 방향",
      "☐ 테스트 20건 이상",
      "☐ 3개월 무상 하자보수",
    ];
    s.addText(checks.join("\n"), {
      x: 7.1,
      y: 2.15,
      w: 5.5,
      h: 3.0,
      fontSize: 16,
      color: C.muted,
      fontFace: "Malgun Gothic",
      valign: "top",
    });

    card(s, 0.35, 5.75, 12.6, 1.2, C.slate);
    s.addText("품질 · 보안 · 이슈", {
      x: 0.55,
      y: 5.9,
      w: 12,
      h: 0.35,
      fontSize: 18,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    s.addText("기능확인 → RAG점검 → 보정  ·  권한·마스킹  ·  발주자 협의", {
      x: 0.55,
      y: 6.35,
      w: 12,
      h: 0.35,
      fontSize: 14,
      color: C.muted,
      fontFace: "Malgun Gothic",
    });
    footer(s, "개발총괄 이상윤 · 기능 검수 성용준 · PM 이태우  ·  발주자 보고용");
  }

  return pptx.writeFile({ fileName: join(root, "docs", "스프린트-플래닝.pptx") }).then(() => {
    console.log("OK 스프린트-플래닝.pptx (5 slides, editable text)");
  });
}

/** —— 회의록 —— */
function buildMeetingPptx() {
  const pptx = newPptx("회의록");
  const meetings = [
    {
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

  for (const m of meetings) {
    const s = pptx.addSlide();
    addNavMeeting(s, `${m.n} / 4`);
    s.addText(`${m.n}차 회의록`, {
      x: 0.35,
      y: 0.7,
      w: 12,
      h: 0.45,
      fontSize: 28,
      bold: true,
      color: C.text,
      fontFace: "Malgun Gothic",
    });
    s.addText(`${m.date}  ·  ${m.topic}`, {
      x: 0.35,
      y: 1.2,
      w: 12.6,
      h: 0.3,
      fontSize: 15,
      color: C.soft,
      fontFace: "Malgun Gothic",
    });
    s.addText("참석: 발주자(프라임에이엑스) · PM 이태우 · 개발총괄 이상윤 · 기능 검수 성용준", {
      x: 0.35,
      y: 1.5,
      w: 12.6,
      h: 0.28,
      fontSize: 13,
      color: C.soft,
      fontFace: "Malgun Gothic",
    });

    const sections = [
      { title: "발주자 요구사항", color: C.amber, bg: "FFF7ED", lines: m.req, y: 1.95 },
      { title: "개발팀 진행방향", color: C.blue, bg: "EFF6FF", lines: m.dir, y: 3.55 },
      { title: "합의 결과", color: C.teal, bg: "F0FDFA", lines: m.agr, y: 5.15 },
    ];
    for (const sec of sections) {
      card(s, 0.35, sec.y, 12.6, 1.45, sec.color);
      s.addShape("roundRect", {
        x: 0.55,
        y: sec.y + 0.15,
        w: 1.9,
        h: 0.35,
        fill: { color: sec.bg },
        line: { color: C.line },
        rectRadius: 0.12,
      });
      s.addText(sec.title, {
        x: 0.55,
        y: sec.y + 0.17,
        w: 1.9,
        h: 0.32,
        fontSize: 13,
        bold: true,
        color: sec.color,
        align: "center",
        fontFace: "Malgun Gothic",
      });
      s.addText(sec.lines.join("\n"), {
        x: 0.6,
        y: sec.y + 0.55,
        w: 12.1,
        h: 0.8,
        fontSize: 14,
        color: C.muted,
        fontFace: "Malgun Gothic",
        valign: "top",
      });
    }
    footer(s, "프라임에이엑스 × PM 이태우 · 개발총괄 이상윤 · 기능 검수 성용준  ·  수행계획서 첨부용");
  }

  return pptx.writeFile({ fileName: join(root, "docs", "회의록.pptx") }).then(() => {
    console.log("OK 회의록.pptx (4 slides, editable text)");
  });
}

await buildSprintPptx();
await buildMeetingPptx();
console.log("Done");
