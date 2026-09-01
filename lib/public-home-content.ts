export type PublicHomeServiceCard = {
  title: string;
  description: string;
  tags: string[];
  /** 카드 우측 인덱스 라벨 (예: DESIGN & FIELDWORK) */
  indexLabel?: string;
};

export type PublicHomeMetric = {
  value: string;
  label: string;
  caption: string;
};

export type PublicHomeRecord = {
  category: string;
  title: string;
  body: string;
  tags: string;
};

export type PublicHomeMilestone = {
  badge: string;
  title: string;
  body: string;
  current?: boolean;
};

export type PublicHomeContent = {
  hero: {
    bannerImageUrl: string;
    engineHref: string;
  };
  intro: {
    kicker: string;
    titleHtml: string;
    leadHtml: string;
  };
  services: {
    kicker: string;
    titleHtml: string;
    lead: string;
    cards: PublicHomeServiceCard[];
    bottomLabel: string;
    inquiryHref: string;
    inquiryLabel: string;
  };
  engine: {
    kicker: string;
    titleHtml: string;
    lead: string;
  };
  axi: {
    kicker: string;
    titleHtml: string;
    body: string;
    buttonLabel: string;
  };
  evidence: {
    kicker: string;
    titleHtml: string;
    lead: string;
    metrics: PublicHomeMetric[];
    recordsKicker: string;
    recordsTitle: string;
    recordsLead: string;
    records: PublicHomeRecord[];
    opsImageUrl: string;
    opsTitleHtml: string;
    opsBody: string;
  };
  milestone: {
    kicker: string;
    titleHtml: string;
    items: PublicHomeMilestone[];
    noteHtml: string;
  };
  contact: {
    kicker: string;
    titleHtml: string;
    email: string;
    phone: string;
    addressHtml: string;
    emailButtonLabel: string;
  };
  sections: {
    intro: boolean;
    services: boolean;
    engine: boolean;
    axi: boolean;
    evidence: boolean;
    milestone: boolean;
    contact: boolean;
  };
};

export const DEFAULT_PUBLIC_HOME_CONTENT: PublicHomeContent = {
  hero: {
    bannerImageUrl: "/primeax-home/assets/primeax-hero-clean.png",
    engineHref: "#engine",
  },
  intro: {
    kicker: "",
    titleHtml: "END-TO-END<br /><em>RESEARCH SYSTEM</em>",
    leadHtml:
      "PRIME AX는 과업 목표를 구조화하고, 표준화된 조사 운영과 근거 기반 분석을 거쳐 <strong>개선 우선순위·KPI·실행 로드맵</strong>까지 전 과정을 실행 가능한 전략으로 제시합니다.",
  },
  services: {
    kicker: "",
    titleHtml: "Execution Roadmap",
    lead: "과업 목적에 맞는 Research Design과 전문 심사 운영, 정량·정성 통합분석을 통해 개선 우선순위와 실행 로드맵을 제시합니다.",
    cards: [
      {
        title: "조사 설계·운영",
        description:
          "조사 목적을 측정 가능한 지표로 전환하고, 특성에 맞는 표본·문항·실사·품질관리 체계 설계",
        tags: ["Research Framework · KPI", "Sampling & Questionnaire Design", "CAWI · CAPI · Field QA"],
        indexLabel: "DESIGN & FIELDWORK",
      },
      {
        title: "통합 데이터 분석",
        description:
          "통계적 패턴과 응답 맥락을 교차 분석하여 핵심 이슈, 원인, 개선 우선순위를 Evidence 중심으로 도출",
        tags: ["PCSI · IPA · GAP Analysis", "SPSS · Cross-tab · Segmentation", "FGI · IDI · VOC Coding"],
        indexLabel: "MIXED-METHOD ANALYSIS",
      },
      {
        title: "책임 관리",
        description:
          "공공정책부터 CX·기업 실태조사·교육 수요·미스터리 쇼퍼까지 분야별 전담자와 함께 조사 전 과정 책임 운영",
        tags: ["Public Policy · CX Research", "Business Survey · Education Demand", "Mystery Shopper · Outcome"],
        indexLabel: "Responsibility Management",
      },
    ],
    bottomLabel: "PRIME AX / HUMAN INSIGHT × AI INTELLIGENCE",
    inquiryHref: "/admin/surveys/ai-generate",
    inquiryLabel: "RKME MODEL 체험하기",
  },
  engine: {
    kicker: "",
    titleHtml: "RKME MODEL<br /><em>Rag KSIC Mapping Engine System</em>",
    lead: "사업체명·업종 설명·공공데이터·응답 텍스트를 종합해 KSIC 후보와 판단 <span class=\"nowrap\">근거를</span> 제시하고, 조사 설계 모듈로 연결합니다.",
  },
  axi: {
    kicker: "",
    titleHtml: "AXI ADVISOR AGENT",
    body: "AXI는 PRIME AX의 업무 맥락을 이해하도록 설계 중인 Advisor Agent입니다. 조사 목적의 구체화, 설문·분기 초안, 결과 해석, 다음 행동까지 리서치팀의 <span class=\"nowrap\">반복 업무를</span> 보조합니다.",
    buttonLabel: "AXI 상담 시작",
  },
  evidence: {
    kicker: "",
    titleHtml: "DELIVERY EVIDENCE",
    lead: "조사 기획·실사·분석·제언을 단일 품질기준으로 관리해 온 경험을 바탕으로 <span class=\"nowrap\">AI 플랫폼을</span> 고도화합니다.",
    metrics: [
      { value: "30<sup>+</sup>", label: "YEARS", caption: "현장·운영 경험" },
      { value: "20<sup>+</sup>", label: "YEARS", caption: "전문 조사 네트워크" },
      { value: "E2E", label: "DELIVERY", caption: "설계 · 실사 · 분석 · 제언" },
    ],
    recordsKicker: "PROJECT RECORDS",
    recordsTitle: "주요 수행실적",
    recordsLead:
      "공공·지역·관광·교육 분야의 조사 운영 경험을 과업별 품질기준과 <span class=\"nowrap\">실행 제언으로</span> 축적해 왔습니다.",
    records: [
      {
        category: "PUBLIC CX",
        title: "공공기관 서비스 품질 조사",
        body: "남원시청 방문친절도 조사<br />안산시 방문 모니터링",
        tags: "친절도 · 미스터리 쇼퍼 · 민원응대",
      },
      {
        category: "POLICY",
        title: "정책·지역사회 조사",
        body: "속초시 인구감소 대응 조사<br />공공사업 성과·인식 조사",
        tags: "정책수요 · 국민인식 · 성과분석",
      },
      {
        category: "TOURISM & MARINE",
        title: "관광·해양 만족도 조사",
        body: "괴산고추축제 만족도 조사<br />지방·국가어항 이용자 만족도",
        tags: "축제평가 · 관광수요 · 이용경험",
      },
      {
        category: "EDUCATION",
        title: "대학·교육 수요 조사",
        body: "학생·교직원·산업체 수요조사<br />교육사업 성과 및 과정개편 조사",
        tags: "교육수요 · 핵심역량 · 성과관리",
      },
    ],
    opsImageUrl: "/primeax-home/upload/operations-photo-face-hidden.png",
    opsTitleHtml: "전문조사원 네트워크 확보와<br />표준품질관리체계 구축",
    opsBody: "",
  },
  milestone: {
    kicker: "06 / 2026 PRE-STARTUP DELIVERY",
    titleHtml: "개발은 완료 단계,<br /><em>검수와 인계로 갑니다.</em>",
    items: [
      {
        badge: "01",
        title: "KSIC Master Data Modeling",
        body: "코드·정의·분류체계·AI 컨텍스트 구조화",
      },
      {
        badge: "02",
        title: "RAG 기반 설문 3안 생성",
        body: "검색·외부 코드 교차검증·근거·보완질문 연결",
      },
      {
        badge: "03",
        title: "Internal Web Platform",
        body: "입력·결과 확인·관리 콘솔 구축",
      },
      {
        badge: "NOW",
        title: "QA · Acceptance · Handover",
        body: "표준 시나리오 테스트, 보정, 최종 검수·인계 진행",
        current: true,
      },
    ],
    noteHtml: "",
  },
  contact: {
    kicker: "",
    titleHtml: "성공적인 조사에 필요한<br /><em>최적의 솔루션을 함께 설계합니다</em>",
    email: "shwa710@naver.com",
    phone: "070-4168-9075",
    addressHtml: "대전광역시 중구 계백로 1719, 센트리아오피스텔 503호",
    emailButtonLabel: "이메일로 문의하기",
  },
  sections: {
    intro: true,
    services: true,
    engine: true,
    axi: true,
    evidence: true,
    milestone: false,
    contact: true,
  },
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asNonEmptyString(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const next = value.filter((v): v is string => typeof v === "string");
  return next.length > 0 ? next : fallback;
}

export function parsePublicHomeContent(raw: unknown): PublicHomeContent {
  const d = DEFAULT_PUBLIC_HOME_CONTENT;
  if (!raw || typeof raw !== "object") return structuredClone(d);
  const o = raw as Record<string, unknown>;

  const hero = (o.hero ?? {}) as Record<string, unknown>;
  const intro = (o.intro ?? {}) as Record<string, unknown>;
  const services = (o.services ?? {}) as Record<string, unknown>;
  const engine = (o.engine ?? {}) as Record<string, unknown>;
  const axi = (o.axi ?? {}) as Record<string, unknown>;
  const evidence = (o.evidence ?? {}) as Record<string, unknown>;
  const milestone = (o.milestone ?? {}) as Record<string, unknown>;
  const contact = (o.contact ?? {}) as Record<string, unknown>;
  const sections = (o.sections ?? {}) as Record<string, unknown>;

  const cardsRaw = Array.isArray(services.cards) ? services.cards : d.services.cards;
  const cards: PublicHomeServiceCard[] = cardsRaw.map((card, i) => {
    const c = (card ?? {}) as Record<string, unknown>;
    const fallback = d.services.cards[i] ?? d.services.cards[0];
    return {
      title: asString(c.title, fallback.title),
      description: asString(c.description, fallback.description),
      tags: asStringArray(c.tags, fallback.tags),
      indexLabel: asString(c.indexLabel, fallback.indexLabel ?? "SERVICE"),
    };
  });

  const metricsRaw = Array.isArray(evidence.metrics) ? evidence.metrics : d.evidence.metrics;
  const metrics: PublicHomeMetric[] = metricsRaw.map((m, i) => {
    const row = (m ?? {}) as Record<string, unknown>;
    const fallback = d.evidence.metrics[i] ?? d.evidence.metrics[0];
    return {
      value: asString(row.value, fallback.value),
      label: asString(row.label, fallback.label),
      caption: asString(row.caption, fallback.caption),
    };
  });

  const recordsRaw = Array.isArray(evidence.records) ? evidence.records : d.evidence.records;
  const records: PublicHomeRecord[] = recordsRaw.map((r, i) => {
    const row = (r ?? {}) as Record<string, unknown>;
    const fallback = d.evidence.records[i] ?? d.evidence.records[0];
    return {
      category: asString(row.category, fallback.category),
      title: asString(row.title, fallback.title),
      body: asString(row.body, fallback.body),
      tags: asString(row.tags, fallback.tags),
    };
  });

  const itemsRaw = Array.isArray(milestone.items) ? milestone.items : d.milestone.items;
  const items: PublicHomeMilestone[] = itemsRaw.map((it, i) => {
    const row = (it ?? {}) as Record<string, unknown>;
    const fallback = d.milestone.items[i] ?? d.milestone.items[0];
    return {
      badge: asString(row.badge, fallback.badge),
      title: asString(row.title, fallback.title),
      body: asString(row.body, fallback.body),
      current: asBool(row.current, Boolean(fallback.current)),
    };
  });

  const replaceLegacy = (value: string, legacy: string, next: string) =>
    value === legacy ? next : value;

  return {
    hero: {
      bannerImageUrl: d.hero.bannerImageUrl,
      engineHref: asString(hero.engineHref, d.hero.engineHref),
    },
    intro: {
      kicker: replaceLegacy(asString(intro.kicker, d.intro.kicker), "01 / END-TO-END RESEARCH SYSTEM", d.intro.kicker),
      titleHtml: replaceLegacy(
        asString(intro.titleHtml, d.intro.titleHtml),
        "리서치 전 과정을<br /><em>실행 가능한 전략으로.</em>",
        d.intro.titleHtml,
      ),
      leadHtml: replaceLegacy(
        asString(intro.leadHtml, d.intro.leadHtml),
        "조사는 데이터 수집에서 끝나지 않습니다. PRIME AX는 과업 목표를 구조화하고, 표준화된 조사 운영과 근거 기반 분석을 거쳐 <strong>개선 우선순위·KPI·실행 로드맵</strong>까지 제시합니다.",
        d.intro.leadHtml,
      ),
    },
    services: {
      kicker: replaceLegacy(asString(services.kicker, d.services.kicker), "02 / RESEARCH SERVICE", d.services.kicker),
      titleHtml: replaceLegacy(
        asString(services.titleHtml, d.services.titleHtml),
        "조사 결과를 넘어,<br /><em>실행 근거를 설계합니다.</em>",
        d.services.titleHtml,
      ),
      lead: asString(services.lead, d.services.lead),
      cards:
        cards.some(
          (card) =>
            card.title === "공공·기업 리서치 파트너십" ||
            card.title === "정량·정성 통합분석",
        )
          ? d.services.cards
          : cards.length > 0
            ? cards
            : d.services.cards,
      bottomLabel: asString(services.bottomLabel, d.services.bottomLabel),
      inquiryHref: asNonEmptyString(services.inquiryHref, d.services.inquiryHref),
      inquiryLabel: asNonEmptyString(services.inquiryLabel, d.services.inquiryLabel),
    },
    engine: {
      kicker: replaceLegacy(asString(engine.kicker, d.engine.kicker), "03 / PRODUCT · RAG KSIC ENGINE", d.engine.kicker),
      titleHtml: replaceLegacy(
        asString(engine.titleHtml, d.engine.titleHtml),
        "산업을 이해하고,<br /><em>조사의 시작을 설계합니다.</em>",
        d.engine.titleHtml,
      ),
      lead: asString(engine.lead, d.engine.lead),
    },
    axi: {
      kicker: replaceLegacy(asString(axi.kicker, d.axi.kicker), "04 / AXI ADVISOR AGENT", d.axi.kicker),
      titleHtml: replaceLegacy(
        asString(axi.titleHtml, d.axi.titleHtml),
        "질문에 답하고,<br /><em>판단을 보조합니다.</em>",
        d.axi.titleHtml,
      ),
      body: asString(axi.body, d.axi.body),
      buttonLabel: asString(axi.buttonLabel, d.axi.buttonLabel),
    },
    evidence: {
      kicker: replaceLegacy(asString(evidence.kicker, d.evidence.kicker), "05 / DELIVERY EVIDENCE", d.evidence.kicker),
      titleHtml: replaceLegacy(
        asString(evidence.titleHtml, d.evidence.titleHtml),
        "현장에서 검증된<br /><em>실행 역량.</em>",
        d.evidence.titleHtml,
      ),
      lead: asString(evidence.lead, d.evidence.lead),
      metrics: metrics.length > 0 ? metrics : d.evidence.metrics,
      recordsKicker: replaceLegacy(
        asString(evidence.recordsKicker, d.evidence.recordsKicker),
        "SELECTED PROJECT RECORDS",
        d.evidence.recordsKicker,
      ),
      recordsTitle: asString(evidence.recordsTitle, d.evidence.recordsTitle),
      recordsLead: asString(evidence.recordsLead, d.evidence.recordsLead),
      records: records.some((r) => r.title === "공공기관 서비스 품질")
        ? d.evidence.records
        : records.length > 0
          ? records
          : d.evidence.records,
      opsImageUrl: d.evidence.opsImageUrl,
      opsTitleHtml: replaceLegacy(
        asString(evidence.opsTitleHtml, d.evidence.opsTitleHtml),
        "전문조사원 네트워크와<br />표준 품질 관리 체계",
        d.evidence.opsTitleHtml,
      ),
      opsBody: replaceLegacy(
        asString(evidence.opsBody, d.evidence.opsBody),
        "현장 실행력과 AI 분석을 함께 운영합니다.",
        d.evidence.opsBody,
      ),
    },
    milestone: {
      kicker: asString(milestone.kicker, d.milestone.kicker),
      titleHtml: asString(milestone.titleHtml, d.milestone.titleHtml),
      items: items.length > 0 ? items : d.milestone.items,
      noteHtml: asString(milestone.noteHtml, d.milestone.noteHtml),
    },
    contact: {
      kicker: replaceLegacy(asString(contact.kicker, d.contact.kicker), "07 / START A PROJECT", d.contact.kicker),
      titleHtml: replaceLegacy(
        asString(contact.titleHtml, d.contact.titleHtml),
        "다음 조사에 필요한<br /><em>답을 함께 설계합니다.</em>",
        d.contact.titleHtml,
      ),
      email: asString(contact.email, d.contact.email),
      phone: asString(contact.phone, d.contact.phone) || d.contact.phone,
      addressHtml:
        asString(contact.addressHtml, d.contact.addressHtml).trim() ||
        d.contact.addressHtml,
      emailButtonLabel: asString(contact.emailButtonLabel, d.contact.emailButtonLabel),
    },
    sections: {
      intro: asBool(sections.intro, d.sections.intro),
      services: asBool(sections.services, d.sections.services),
      engine: asBool(sections.engine, d.sections.engine),
      axi: asBool(sections.axi, d.sections.axi),
      evidence: asBool(sections.evidence, d.sections.evidence),
      milestone:
        asBool(sections.milestone, d.sections.milestone) &&
        asString(milestone.titleHtml, d.milestone.titleHtml) !==
          "개발은 완료 단계,<br /><em>검수와 인계로 갑니다.</em>",
      contact: asBool(sections.contact, d.sections.contact),
    },
  };
}

function escAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const ROADMAP_CARD_META = [
  {
    modifier: "roadmap-card--blue",
    image: "/primeax-home/assets/execution-roadmap/design-fieldwork.png",
    alt: "조사 설계 및 운영 흐름을 표현한 일러스트",
  },
  {
    modifier: "roadmap-card--cyan",
    image: "/primeax-home/assets/execution-roadmap/mixed-method-analysis.png",
    alt: "정량·정성 데이터를 결합 분석하는 일러스트",
  },
  {
    modifier: "roadmap-card--orange",
    image: "/primeax-home/assets/execution-roadmap/responsibility-management.png",
    alt: "트렌드와 네트워크 분석을 표현한 일러스트",
  },
] as const;

/** 관리자가 입력한 제한적 HTML(br, em, strong, sup)만 허용 */
export function sanitizeHomeHtml(raw: string): string {
  return raw
    .replaceAll(/<(?!\/?(?:br|em|strong|sup|span)\b)[^>]*>/gi, "")
    .replaceAll(/<span(?!\s+class="nowrap")[^>]*>/gi, "")
    .replaceAll(/on\w+=["'][^"']*["']/gi, "");
}

function formatRoadmapTagLine(tag: string): string {
  const parts = tag.split(/\s*·\s*/).filter(Boolean);
  if (parts.length <= 1) return sanitizeHomeHtml(tag);
  return parts
    .map((part, index) =>
      index === 0 ? sanitizeHomeHtml(part) : `<span>·</span> ${sanitizeHomeHtml(part)}`,
    )
    .join(" ");
}

export function buildPublicHomeHtml(content: PublicHomeContent): string {
  const c = content;
  const s = c.sections;
  const parts: string[] = [
    '<!-- PRIME AX body fragment -->',
    '<div class="primeax-embed" data-primeax-root>',
    '<main id="main">',
  ];

  parts.push(`
    <section class="hero banner-hero" id="top" aria-label="PRIME AX Research Intelligence">
      <div class="banner-motion-wrap">
        <img class="banner-motion" src="${escAttr(c.hero.bannerImageUrl)}" alt="PRIME AX Research Intelligence" />
        <div class="banner-copy" aria-label="PRIME AX Research Intelligence">
          <h1>Research Intelligence</h1>
          <div class="banner-copy-align">
            <p class="banner-product">RAG-BASED KSIC AUTO-MAPPING <span>·</span> AXI ADVISOR AGENT</p>
            <ul class="banner-analysis" aria-label="분석 역량">
              <li>PCSI measurement</li><li>SPSS analytics</li><li>SWOT strategy</li><li>Actionable Decision Support</li>
            </ul>
            <ul class="banner-service-pills" aria-label="주요 조사 서비스">
              <li>공공기관 CX</li><li>기업 실태조사</li><li>교육 수요조사</li><li>미스터리 쇼퍼</li>
            </ul>
          </div>
        </div>
        <div class="banner-pipeline-label" aria-hidden="true"><strong>AI RESEARCH PIPELINE</strong><span>RAG &gt; KSIC &gt; Human-in-the-loop (HITL)</span></div>
        <span class="banner-scan-line" aria-hidden="true"></span>
        <span class="banner-network-pulse pulse-one" aria-hidden="true"></span>
        <span class="banner-network-pulse pulse-two" aria-hidden="true"></span>
        <span class="banner-network-pulse pulse-three" aria-hidden="true"></span>
        <span class="banner-chart-motion" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
        <span class="banner-live-score" aria-label="실시간 분석 점수"><strong data-banner-score>83</strong><em>%</em><small>LIVE</small></span>
        <span class="banner-axi-motion axi-character-motion" aria-hidden="true"><i></i><img class="axi-motion-base" src="/primeax-home/assets/axi-motion.png" alt="" /><img class="axi-hand-motion" src="/primeax-home/assets/axi-motion.png" alt="" /><span class="axi-eye axi-eye-left"></span><span class="axi-eye axi-eye-right"></span></span>
        <div class="banner-axi-label" aria-hidden="true">AXI · AI RESEARCH ADVISOR AGENT</div>
      </div>
    </section>`);

  if (s.intro) {
    parts.push(`
    <section class="platform-intro scroll-reveal" id="why">
      <div class="platform-copy">
        <h2>${sanitizeHomeHtml(c.intro.titleHtml)}</h2>
        <p class="platform-lead">${sanitizeHomeHtml(c.intro.leadHtml)}</p>
        <div class="platform-flow" aria-label="Human Insight에서 전략 제언으로 연결되는 PRIME AX 인사이트 흐름">
          <div class="insight-node"><b>Human Insight</b><small>현장 맥락 · 품질 기준</small></div><i class="flow-connector" aria-hidden="true"></i>
          <div class="insight-node insight-node-centered"><b>Evidence Analysis</b><small>근거 검증</small></div><i class="flow-connector" aria-hidden="true"></i>
          <div class="insight-node insight-node-centered"><b>Decision Strategy</b><small>Priority · KPI · Action</small></div>
        </div>
        <div class="platform-actions"><a class="btn-platform" href="#services">리서치 서비스 <b>→</b></a></div>
      </div>
      <div class="research-visual process-visual" aria-label="설계, 수집, 분석, 전략 제언의 리서치 전 과정">
        <div class="visual-head"><div><span></span><b>RESEARCH DELIVERY WORKFLOW</b></div></div>
        <div class="process-heading"><div><strong>Decision-Ready Insight</strong></div><div class="motion-copy-rail continuous-flow" aria-label="DESIGN에서 ACTION까지 진행"><span>DESIGN</span><i></i><span>FIELD</span><i></i><span>INSIGHT</span><i></i><span>ACTION</span><b class="continuous-flow-dot" aria-hidden="true"></b></div></div>
        <div class="research-process" aria-label="Four-stage research workflow">
          <article class="process-card process-design"><div class="process-icon" aria-hidden="true"><i></i><i></i><i></i></div><b>RESEARCH DESIGN</b></article>
          <i class="process-arrow" aria-hidden="true"><b></b></i>
          <article class="process-card process-field"><div class="process-icon field-icon" aria-hidden="true"><i></i><i></i><i></i></div><b>DATA COLLECTION</b></article>
          <i class="process-arrow" aria-hidden="true"><b></b></i>
          <article class="process-card process-analysis"><div class="process-icon analysis-icon" aria-hidden="true"><i></i><i></i><i></i></div><b>INTEGRATED ANALYSIS</b></article>
          <i class="process-arrow" aria-hidden="true"><b></b></i>
          <article class="process-card process-action"><div class="process-icon action-icon" aria-hidden="true"><i></i><i></i><i></i></div><b>STRATEGIC RECOMMENDATIONS</b></article>
        </div>
        <div class="process-output"><span>OUTPUT</span><b>REPORT</b><i></i><b>IMPROVEMENT PRIORITIES</b><i></i><b>Execution Roadmap</b></div>
      </div>
    </section>`);
  }

  if (s.services) {
    const cardHtml = c.services.cards
      .map((card, i) => {
        const meta = ROADMAP_CARD_META[i % ROADMAP_CARD_META.length];
        const tags = card.tags
          .map((t) => `<li>${formatRoadmapTagLine(t)}</li>`)
          .join("");
        const indexLabel = card.indexLabel?.trim() || "SERVICE";
        return `<article class="roadmap-card ${meta.modifier} scroll-reveal"><div class="eyebrow">${sanitizeHomeHtml(indexLabel)}</div><img src="${escAttr(meta.image)}" alt="${escAttr(meta.alt)}" loading="lazy" /><h3>${sanitizeHomeHtml(card.title)}</h3><p class="summary">${sanitizeHomeHtml(card.description)}</p><div class="divider" aria-hidden="true"></div><ul>${tags}</ul></article>`;
      })
      .join("");
    parts.push(`
    <section class="service-suite scroll-reveal" id="services" aria-labelledby="services-title">
      <div class="roadmap-shell">
        <header class="suite-head roadmap-header"><h2 id="services-title">${sanitizeHomeHtml(c.services.titleHtml)}</h2><p>${sanitizeHomeHtml(c.services.lead)}</p></header>
        <section class="roadmap-grid" aria-label="Execution Roadmap 주요 영역">${cardHtml}</section>
      </div>
    </section>`);
  }

  if (s.engine) {
    parts.push(`
    <section class="engine-section" id="engine">
      <div class="section-head"><h2>${sanitizeHomeHtml(c.engine.titleHtml)}</h2><div class="section-head-aside"><a class="btn-suite-cta" href="${escAttr(c.services.inquiryHref)}">${sanitizeHomeHtml(c.services.inquiryLabel)}</a><p>${sanitizeHomeHtml(c.engine.lead)}</p></div></div>
      <figure class="rkme-delivery scroll-reveal" aria-labelledby="rkme-delivery-title">
        <figcaption class="rkme-delivery-head">
          <div><span class="rkme-status-dot" aria-hidden="true"></span><b>RESEARCH DELIVERY WORKFLOW</b></div>
        </figcaption>
        <div class="rkme-delivery-title">
          <div><h3 id="rkme-delivery-title">Decision-Ready Intelligence Pipeline</h3></div>
          <div class="motion-copy-rail continuous-flow" aria-label="DESIGN에서 ACTION까지 진행"><span>DESIGN</span><i></i><span>FIELD</span><i></i><span>INSIGHT</span><i></i><span>ACTION</span><b class="continuous-flow-dot" aria-hidden="true"></b></div>
        </div>
        <div class="rkme-flow" role="list" aria-label="RKME 리서치 딜리버리 5단계">
          <article class="rkme-flow-card" role="listitem">
            <div class="rkme-card-top"><span>STEP 1</span><i class="rkme-step-icon icon-design" aria-hidden="true"><b></b><b></b><b></b></i></div>
            <h4>Research Design</h4>
            <ul><li>KSIC Classification</li><li>Questionnaire &amp; Scale DB</li><li>Logic &amp; Sample Metadata</li></ul>
          </article>
          <i class="rkme-flow-arrow" aria-hidden="true"><b></b></i>
          <article class="rkme-flow-card" role="listitem">
            <div class="rkme-card-top"><span>STEP 2</span><i class="rkme-step-icon icon-collect" aria-hidden="true"><b></b><b></b><b></b></i></div>
            <h4>Data Collection</h4>
            <ul><li>Automated Data Crawling</li><li>Structured Data Storage</li><li>Raw Record Validation</li></ul>
          </article>
          <i class="rkme-flow-arrow" aria-hidden="true"><b></b></i>
          <article class="rkme-flow-card rkme-flow-card-cyan" role="listitem">
            <div class="rkme-card-top"><span>STEP 3</span><i class="rkme-step-icon icon-semantic" aria-hidden="true"><b></b><b></b><b></b></i></div>
            <h4>AI Semantic Engine</h4>
            <ul><li>Semantic Language Parsing</li><li>Context &amp; Scale Alignment</li><li>Vector Mapping Logic</li></ul>
          </article>
          <i class="rkme-flow-arrow" aria-hidden="true"><b></b></i>
          <article class="rkme-flow-card" role="listitem">
            <div class="rkme-card-top"><span>STEP 4</span><i class="rkme-step-icon icon-mapping" aria-hidden="true"><b></b><b></b><b></b></i></div>
            <h4>Visual Mapping</h4>
            <ul><li>Interactive Dashboard UI</li><li>Dynamic Classification Map</li><li>Visual Insight Review</li></ul>
          </article>
          <i class="rkme-flow-arrow" aria-hidden="true"><b></b></i>
          <article class="rkme-flow-card rkme-flow-card-cyan" role="listitem">
            <div class="rkme-card-top"><span>STEP 5</span><i class="rkme-step-icon icon-delivery" aria-hidden="true"><b></b><b></b><b></b></i></div>
            <h4>Insight Delivery</h4>
            <ul><li>Research Task Execution</li><li>End-User Intelligence Access</li><li>Actionable Business Insight</li></ul>
          </article>
        </div>
        <div class="rkme-output"><strong>OUTPUT</strong><span>Research Report</span><i></i><span>Improvement Priorities</span><i></i><span>Execution Roadmap</span></div>
      </figure>
      <div class="engine-workbench">
        <div class="workbench-top"><div><span class="live-dot"></span>INTERACTIVE PROTOTYPE</div><div class="motion-copy-rail workbench-motion" aria-label="입력에서 전문가 검토까지 진행"><span>입력</span><i></i><span>검색·검증</span><i></i><span>RAG 생성</span><i></i><span>전문가 검토</span></div></div>
        <div class="engine-grid">
          <form id="ksic-form" class="brief-form">
            <label for="industry-input">사업·조사 내용 입력</label>
            <textarea id="industry-input" placeholder="예: 이차전지 제조기업의 인력 수요와 직무 역량을 조사하고 싶습니다.">이차전지 제조기업의 인력 수요와 직무 역량을 조사하고 싶습니다.</textarea>
            <div class="quick-brief"><button type="button" data-brief="스마트제조 기업의 생산성 향상과 현장 인력 수요를 조사합니다.">스마트제조</button><button type="button" data-brief="지역 대학 재학생의 교육 만족도와 취업 역량을 진단합니다.">교육 수요</button><button type="button" data-brief="공공기관 민원 응대 서비스의 친절도와 개선 과제를 진단합니다.">공공 CX</button></div>
            <button class="run-button" type="submit"><span>RKME MODEL</span><b>→</b></button>
            <p class="form-note">* 화면은 매핑·설문생성 흐름을 보여주는 프로토타입입니다.</p>
          </form>
          <div class="result-panel" aria-live="polite">
            <div class="result-top"><span>RAG ANALYSIS RESULT</span><b id="confidence">READY</b></div>
            <div id="result-empty" class="result-empty"><div class="radar"><i></i><i></i><i></i><i></i></div><p>조사 내용을 입력하고<br />AI 매핑을 실행해 보세요.</p></div>
            <div id="result-content" class="result-content" hidden>
              <p class="result-label">RECOMMENDED KSIC</p><div id="code-result" class="code-result"></div><div class="rationale"><span>근거 추출</span><p id="rationale-text"></p></div><div class="clarify"><b>AXI CHECK</b><p id="clarify-text"></p></div>
            </div>
          </div>
        </div>
      </div>
    </section>`);
  }

  if (s.axi) {
    parts.push(`
    <section class="axi-section" id="axi">
      <div class="axi-copy"><h2>${sanitizeHomeHtml(c.axi.titleHtml)}</h2><p>${sanitizeHomeHtml(c.axi.body)}</p><button class="btn-dark" data-open-axi>${sanitizeHomeHtml(c.axi.buttonLabel)} <b>↗</b></button></div>
      <div class="axi-console"><div class="console-head"><span>AXI / ADVISOR CONSOLE</span><i></i><b>ONLINE</b></div><div class="console-chat"><div class="bubble axi-bubble">안녕하세요. 어떤 조사 의사결정을 준비하고 계신가요?</div><div class="intent"><small>RESEARCH INTENT DETECTED</small><b>교육과정 수요조사</b><span>목적 · 대상 · 핵심지표를 정리합니다.</span></div><div class="console-dots"><i></i><i></i><i></i></div></div><div class="console-input">조사 목적을 입력하세요 <b>↑</b></div></div>
    </section>`);
  }

  if (s.evidence) {
    const metricsHtml = c.evidence.metrics
      .map(
        (m) =>
          `<article><strong>${sanitizeHomeHtml(m.value)}</strong><span>${sanitizeHomeHtml(m.label)}</span><p>${sanitizeHomeHtml(m.caption)}</p></article>`,
      )
      .join("");
    const recordsHtml = c.evidence.records
      .map(
        (r) =>
          `<article><span>${sanitizeHomeHtml(r.category)}</span><strong>${sanitizeHomeHtml(r.title)}</strong><p>${sanitizeHomeHtml(r.body)}</p><small>${sanitizeHomeHtml(r.tags)}</small></article>`,
      )
      .join("");
    parts.push(`
    <section class="evidence" id="proof">
      <div class="evidence-intro"><h2>${sanitizeHomeHtml(c.evidence.titleHtml)}</h2><div class="evidence-summary"><h3>현장에서 검증된 실행 역량.</h3><p>${sanitizeHomeHtml(c.evidence.lead)}</p></div></div>
      <div class="metrics">${metricsHtml}</div>
      <div class="case-tabs" role="tablist" aria-label="수행영역"><button class="selected" role="tab" aria-selected="true" data-case="public">PUBLIC RESEARCH</button><button role="tab" aria-selected="false" data-case="cx">CX ANALYTICS</button><button role="tab" aria-selected="false" data-case="education">EDUCATION & DEMAND</button></div>
      <div class="case-panel" id="case-panel"><div><h3>정책과 사업의 성과를<br />다음 실행계획으로 유기적 연결</h3><p>이해관계자 만족도·국민인식·청렴체감도·사업 성과 조사를 수행하며, 정량 결과와 현장 의견을 함께 분석해 개선 우선순위를 제공합니다.</p></div><ul><li>조사 설계 및 표본 설계</li><li>전문조사원 실사·품질 관리</li><li>원인 분석·개선과제 도출</li></ul></div>
      <div class="performance-records" aria-labelledby="performance-title">
        <div class="performance-title"><p class="section-kicker">${sanitizeHomeHtml(c.evidence.recordsKicker)}</p><div class="performance-summary"><h3 id="performance-title">${sanitizeHomeHtml(c.evidence.recordsTitle)}</h3><p>${sanitizeHomeHtml(c.evidence.recordsLead)}</p></div></div>
        <div class="performance-grid">${recordsHtml}</div>
      </div>
      <div class="operations-photo"><img src="${escAttr(c.evidence.opsImageUrl)}" alt="전문 조사 운영 현장" /><div><span>RESEARCH OPERATIONS</span><b>${sanitizeHomeHtml(c.evidence.opsTitleHtml)}</b>${c.evidence.opsBody.trim() ? `<p>${sanitizeHomeHtml(c.evidence.opsBody)}</p>` : ""}</div></div>
    </section>`);
  }

  if (s.milestone) {
    const itemsHtml = c.milestone.items
      .map((it) => {
        const cls = it.current ? ' class="current"' : "";
        return `<article${cls}><span>${sanitizeHomeHtml(it.badge)}</span><b>${sanitizeHomeHtml(it.title)}</b><p>${sanitizeHomeHtml(it.body)}</p></article>`;
      })
      .join("");
    const note = c.milestone.noteHtml.trim()
      ? `<p class="milestone-note">${sanitizeHomeHtml(c.milestone.noteHtml)}</p>`
      : "";
    parts.push(`
    <section class="milestone"><div><p class="section-kicker">${sanitizeHomeHtml(c.milestone.kicker)}</p><h2>${sanitizeHomeHtml(c.milestone.titleHtml)}</h2></div><div class="milestone-list">${itemsHtml}</div>${note}</section>`);
  }

  if (s.contact) {
    const phone = c.contact.phone.trim();
    const tel = phone.replace(/[^0-9+]/g, "");
    const phoneBtn = phone
      ? `<a class="email-action phone-action" href="tel:${escAttr(tel)}" aria-label="전화로 문의하기"><span class="email-action-icon" aria-hidden="true">☎</span><span><small>PHONE INQUIRY</small><strong>${sanitizeHomeHtml(phone)}</strong></span><b>↗</b></a>`
      : "";
    parts.push(`
    <section class="contact" id="contact">
      <h2>${sanitizeHomeHtml(c.contact.titleHtml)}</h2>
      <div class="contact-row contact-actions">
        <a class="email-action" href="mailto:${escAttr(c.contact.email)}" aria-label="이메일로 문의하기">
          <span class="email-action-icon" aria-hidden="true">✉</span>
          <span><small>PROJECT INQUIRY</small><strong>${sanitizeHomeHtml(c.contact.emailButtonLabel)}</strong></span><b>↗</b>
        </a>
        ${phoneBtn}
      </div>
    </section>`);
  }

  parts.push("</main>");
  parts.push("</div>");

  return parts.join("\n");
}
