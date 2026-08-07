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
    bannerImageUrl: "/primeax-home/assets/primeax-banner-no-axi.png",
    engineHref: "#engine",
  },
  intro: {
    kicker: "01 / END-TO-END RESEARCH SYSTEM",
    titleHtml: "리서치 전 과정을<br /><em>실행 가능한 전략으로.</em>",
    leadHtml:
      "조사는 데이터 수집에서 끝나지 않습니다. PRIME AX는 과업 목표를 구조화하고, 표준화된 조사 운영과 근거 기반 분석을 거쳐 <strong>개선 우선순위·KPI·실행 로드맵</strong>까지 제시합니다.",
  },
  services: {
    kicker: "02 / RESEARCH SERVICE",
    titleHtml: "조사 결과를 넘어,<br /><em>실행 근거를 설계합니다.</em>",
    lead: "과업 목적에 맞는 Research Design과 전문 실사 운영, 정량·정성 통합분석을 통해 개선 우선순위와 실행 로드맵을 제시합니다.",
    cards: [
      {
        title: "조사 설계·운영",
        description:
          "조사 목적을 측정 가능한 지표로 전환하고, 표본·문항·실사·품질관리 체계를 과업 특성에 맞게 설계합니다.",
        tags: ["Research Framework · KPI", "Sampling & Questionnaire Design", "CAWI · CAPI · Field QA"],
        indexLabel: "DESIGN & FIELDWORK",
      },
      {
        title: "정량·정성 통합분석",
        description:
          "통계적 패턴과 응답 맥락을 함께 분석해 핵심 이슈, 원인, 개선 우선순위를 Evidence 중심으로 도출합니다.",
        tags: ["PCSI · IPA · GAP Analysis", "SPSS · Cross-tab · Segmentation", "FGI · IDI · VOC Coding"],
        indexLabel: "MIXED-METHOD ANALYSIS",
      },
      {
        title: "공공·기업 리서치 파트너십",
        description:
          "공공정책부터 CX·교육 수요·미스터리쇼퍼까지 분야별 전문가와 함께 조사 전 과정을 책임 운영합니다.",
        tags: ["Public Policy · CX Research", "Education Demand · Outcome", "Mystery Shopper · CS Consulting"],
        indexLabel: "RESEARCH PARTNERSHIP",
      },
    ],
    bottomLabel: "PRIME AX / HUMAN INSIGHT × AI INTELLIGENCE",
    inquiryHref: "#contact",
    inquiryLabel: "프로젝트 문의",
  },
  engine: {
    kicker: "03 / PRODUCT · RAG KSIC ENGINE",
    titleHtml: "산업을 이해하고,<br /><em>조사의 시작을 설계합니다.</em>",
    lead: "사업체명·업종 설명·공공데이터·응답 텍스트를 종합해 KSIC 후보와 판단 근거를 제시하고, 조사 설계 모듈로 연결합니다.",
  },
  axi: {
    kicker: "04 / AXI ADVISOR AGENT",
    titleHtml: "질문에 답하고,<br /><em>판단을 보조합니다.</em>",
    body: "AXI는 PRIME AX의 업무 맥락을 이해하도록 설계 중인 Advisor Agent입니다. 조사 목적의 구체화, 설문·분기 초안, 결과 해석, 다음 행동까지 리서치팀의 반복 업무를 보조합니다.",
    buttonLabel: "AXI 상담 시작",
  },
  evidence: {
    kicker: "05 / DELIVERY EVIDENCE",
    titleHtml: "현장에서 검증된<br /><em>실행 역량.</em>",
    lead: "조사 기획·실사·분석·제언을 단일 품질기준으로 관리해 온 경험을 바탕으로 AI 플랫폼을 고도화합니다.",
    metrics: [
      { value: "30<sup>+</sup>", label: "YEARS", caption: "현장·운영 경험" },
      { value: "20<sup>+</sup>", label: "YEARS", caption: "전문 조사 네트워크" },
      { value: "E2E", label: "DELIVERY", caption: "설계 · 실사 · 분석 · 제언" },
    ],
    recordsKicker: "SELECTED PROJECT RECORDS",
    recordsTitle: "주요 수행실적",
    recordsLead:
      "공공·지역·관광·교육 분야의 조사 운영 경험을 과업별 품질기준과 실행 제언으로 축적해 왔습니다.",
    records: [
      {
        category: "PUBLIC CX",
        title: "공공기관 서비스 품질",
        body: "남원시청 방문친절도 조사<br />안산시 방문 모니터링",
        tags: "친절도 · 미스터리쇼퍼 · 민원응대",
      },
      {
        category: "POLICY",
        title: "정책·지역사회 조사",
        body: "속초시 인구감소 대응 조사<br />공공사업 성과·인식 조사",
        tags: "정책수요 · 국민인식 · 성과분석",
      },
      {
        category: "TOURISM & MARINE",
        title: "관광·해양 만족도",
        body: "괴산고추축제 만족도 조사<br />지방·국가어항 이용자 만족도",
        tags: "축제평가 · 관광수요 · 이용경험",
      },
      {
        category: "EDUCATION",
        title: "대학·교육 수요조사",
        body: "학생·교직원·산업체 수요조사<br />교육사업 성과 및 과정개편 조사",
        tags: "교육수요 · 핵심역량 · 성과관리",
      },
    ],
    opsImageUrl: "/primeax-home/upload/operations-photo-face-hidden.png",
    opsTitleHtml: "전문조사원 네트워크와<br />표준 품질 관리 체계",
    opsBody: "현장 실행력과 AI 분석을 함께 운영합니다.",
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
    kicker: "07 / START A PROJECT",
    titleHtml: "다음 조사에 필요한<br /><em>답을 함께 설계합니다.</em>",
    email: "shwa710@naver.com",
    phone: "",
    addressHtml: "",
    emailButtonLabel: "이메일로 문의하기",
  },
  sections: {
    intro: true,
    services: true,
    engine: true,
    axi: true,
    evidence: true,
    milestone: true,
    contact: true,
  },
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
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

  const rawBanner = asString(hero.bannerImageUrl, d.hero.bannerImageUrl);
  // 기본 번들에 AXI 마스코트·라벨이 있던 옛 배너는 AXI 없는 버전으로 교체
  const legacyBanners = new Set([
    "/primeax-home/assets/primeax-banner-no-logo.png",
    "/primeax-home/assets/primeax-banner.png",
    "/primeax-home/assets/primeax-banner-v2.png",
    "assets/primeax-banner-no-logo.png",
  ]);
  const bannerImageUrl = legacyBanners.has(rawBanner) ? d.hero.bannerImageUrl : rawBanner;

  return {
    hero: {
      bannerImageUrl,
      engineHref: asString(hero.engineHref, d.hero.engineHref),
    },
    intro: {
      kicker: asString(intro.kicker, d.intro.kicker),
      titleHtml: asString(intro.titleHtml, d.intro.titleHtml),
      leadHtml: asString(intro.leadHtml, d.intro.leadHtml),
    },
    services: {
      kicker: asString(services.kicker, d.services.kicker),
      titleHtml: asString(services.titleHtml, d.services.titleHtml),
      lead: asString(services.lead, d.services.lead),
      cards: cards.length > 0 ? cards : d.services.cards,
      bottomLabel: asString(services.bottomLabel, d.services.bottomLabel),
      inquiryHref: asString(services.inquiryHref, d.services.inquiryHref),
      inquiryLabel: asString(services.inquiryLabel, d.services.inquiryLabel),
    },
    engine: {
      kicker: asString(engine.kicker, d.engine.kicker),
      titleHtml: asString(engine.titleHtml, d.engine.titleHtml),
      lead: asString(engine.lead, d.engine.lead),
    },
    axi: {
      kicker: asString(axi.kicker, d.axi.kicker),
      titleHtml: asString(axi.titleHtml, d.axi.titleHtml),
      body: asString(axi.body, d.axi.body),
      buttonLabel: asString(axi.buttonLabel, d.axi.buttonLabel),
    },
    evidence: {
      kicker: asString(evidence.kicker, d.evidence.kicker),
      titleHtml: asString(evidence.titleHtml, d.evidence.titleHtml),
      lead: asString(evidence.lead, d.evidence.lead),
      metrics: metrics.length > 0 ? metrics : d.evidence.metrics,
      recordsKicker: asString(evidence.recordsKicker, d.evidence.recordsKicker),
      recordsTitle: asString(evidence.recordsTitle, d.evidence.recordsTitle),
      recordsLead: asString(evidence.recordsLead, d.evidence.recordsLead),
      records: records.length > 0 ? records : d.evidence.records,
      opsImageUrl: asString(evidence.opsImageUrl, d.evidence.opsImageUrl),
      opsTitleHtml: asString(evidence.opsTitleHtml, d.evidence.opsTitleHtml),
      opsBody: asString(evidence.opsBody, d.evidence.opsBody),
    },
    milestone: {
      kicker: asString(milestone.kicker, d.milestone.kicker),
      titleHtml: asString(milestone.titleHtml, d.milestone.titleHtml),
      items: items.length > 0 ? items : d.milestone.items,
      noteHtml: asString(milestone.noteHtml, d.milestone.noteHtml),
    },
    contact: {
      kicker: asString(contact.kicker, d.contact.kicker),
      titleHtml: asString(contact.titleHtml, d.contact.titleHtml),
      email: asString(contact.email, d.contact.email),
      phone: asString(contact.phone, d.contact.phone),
      addressHtml: asString(contact.addressHtml, d.contact.addressHtml),
      emailButtonLabel: asString(contact.emailButtonLabel, d.contact.emailButtonLabel),
    },
    sections: {
      intro: asBool(sections.intro, d.sections.intro),
      services: asBool(sections.services, d.sections.services),
      engine: asBool(sections.engine, d.sections.engine),
      axi: asBool(sections.axi, d.sections.axi),
      evidence: asBool(sections.evidence, d.sections.evidence),
      milestone: asBool(sections.milestone, d.sections.milestone),
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

/** 관리자가 입력한 제한적 HTML(br, em, strong, sup)만 허용 */
export function sanitizeHomeHtml(raw: string): string {
  return raw
    .replaceAll(/<(?!\/?(?:br|em|strong|sup)\b)[^>]*>/gi, "")
    .replaceAll(/on\w+=["'][^"']*["']/gi, "");
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
        <span class="banner-scan-line" aria-hidden="true"></span>
        <span class="banner-network-pulse pulse-one" aria-hidden="true"></span>
        <span class="banner-network-pulse pulse-two" aria-hidden="true"></span>
        <span class="banner-network-pulse pulse-three" aria-hidden="true"></span>
        <span class="banner-chart-motion" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
        <span class="banner-live-score" aria-label="실시간 분석 점수"><strong data-banner-score>83</strong><em>%</em><small>LIVE</small></span>
        <a class="banner-engine-hotspot" href="${escAttr(c.hero.engineHref)}" aria-label="KSIC 매핑엔진 체험하기"></a>
      </div>
    </section>`);

  if (s.intro) {
    parts.push(`
    <section class="platform-intro scroll-reveal" id="why">
      <div class="platform-copy">
        <p class="section-kicker">${sanitizeHomeHtml(c.intro.kicker)}</p>
        <h2>${sanitizeHomeHtml(c.intro.titleHtml)}</h2>
        <p class="platform-lead">${sanitizeHomeHtml(c.intro.leadHtml)}</p>
        <div class="platform-flow" aria-label="PRIME AX 인사이트 흐름">
          <div class="insight-node"><span>01</span><b>Human Insight</b><small>현장 맥락 · 품질 기준</small></div><i class="flow-connector" aria-hidden="true"></i>
          <div class="insight-node"><span>02</span><b>Evidence Analysis</b><small>정량 · 정성 · 근거 검증</small></div><i class="flow-connector" aria-hidden="true"></i>
          <div class="insight-node"><span>03</span><b>Decision Strategy</b><small>Priority · KPI · Action</small></div>
        </div>
        <div class="platform-actions"><a class="btn-platform" href="#services">리서치 서비스 보기 <b>→</b></a><a class="line-link" href="${escAttr(c.hero.engineHref)}">KSIC 엔진 체험 <b>↗</b></a></div>
      </div>
      <div class="research-visual process-visual" aria-label="리서치 전 과정">
        <div class="visual-head"><div><span></span><b>RESEARCH DELIVERY WORKFLOW</b></div><small>ONE TEAM · ONE STANDARD</small></div>
        <div class="process-heading"><div><small>FROM RESEARCH QUESTION</small><strong>Decision-Ready Insight</strong></div><p>DESIGN → FIELD → INSIGHT → ACTION</p></div>
        <div class="research-process" aria-label="리서치 수행 4단계">
          <article class="process-card process-design"><span>01</span><div class="process-icon" aria-hidden="true"><i></i><i></i><i></i></div><small>RESEARCH DESIGN</small><b>조사 설계</b><p>목표·KPI·표본·문항 구조화</p></article>
          <i class="process-arrow" aria-hidden="true"><b></b></i>
          <article class="process-card process-field"><span>02</span><div class="process-icon field-icon" aria-hidden="true"><i></i><i></i><i></i></div><small>DATA COLLECTION</small><b>데이터 수집</b><p>전문 실사·검증·품질관리</p></article>
          <i class="process-arrow" aria-hidden="true"><b></b></i>
          <article class="process-card process-analysis"><span>03</span><div class="process-icon analysis-icon" aria-hidden="true"><i></i><i></i><i></i></div><small>INSIGHT ANALYSIS</small><b>통합 분석</b><p>정량·정성·원인·우선순위</p></article>
          <i class="process-arrow" aria-hidden="true"><b></b></i>
          <article class="process-card process-action"><span>04</span><div class="process-icon action-icon" aria-hidden="true"><i></i><i></i><i></i></div><small>STRATEGIC RECOMMENDATION</small><b>전략 제언</b><p>KPI·Action Plan·Roadmap</p></article>
        </div>
        <div class="process-output"><span>OUTPUT</span><b>읽히는 보고서</b><i></i><b>개선 우선순위</b><i></i><b>실행 로드맵</b></div>
      </div>
    </section>`);
  }

  if (s.services) {
    const cardClasses = ["service-blue", "service-cyan", "service-orange"];
    const cardHtml = c.services.cards
      .map((card, i) => {
        const cls = cardClasses[i % cardClasses.length];
        const tags = card.tags.map((t) => `<li>${sanitizeHomeHtml(t)}</li>`).join("");
        const indexLabel = card.indexLabel?.trim() || "SERVICE";
        const iconClass =
          i === 1 ? "service-icon chart-icon" : i === 2 ? "service-icon network-icon" : "service-icon";
        const iconInner =
          i === 1
            ? "<i></i><i></i><i></i><i></i>"
            : i === 2
              ? "<i></i><i></i><i></i><i></i>"
              : "<i></i><i></i><i></i>";
        return `<article class="service-card ${cls}"><div class="service-index"><span>0${i + 1}</span><small>${sanitizeHomeHtml(indexLabel)}</small></div><div class="${iconClass}" aria-hidden="true">${iconInner}</div><h3>${sanitizeHomeHtml(card.title)}</h3><p>${sanitizeHomeHtml(card.description)}</p><ul>${tags}</ul></article>`;
      })
      .join("");
    parts.push(`
    <section class="service-suite scroll-reveal" id="services" aria-labelledby="services-title">
      <div class="suite-head"><div><p class="section-kicker">${sanitizeHomeHtml(c.services.kicker)}</p><h2 id="services-title">${sanitizeHomeHtml(c.services.titleHtml)}</h2></div><p>${sanitizeHomeHtml(c.services.lead)}</p></div>
      <div class="service-grid">${cardHtml}</div>
      <div class="suite-bottom"><span>${sanitizeHomeHtml(c.services.bottomLabel)}</span><a href="${escAttr(c.services.inquiryHref)}">${sanitizeHomeHtml(c.services.inquiryLabel)} <b>↗</b></a></div>
    </section>`);
  }

  if (s.engine) {
    parts.push(`
    <section class="engine-section" id="engine">
      <div class="section-head"><div><p class="section-kicker">${sanitizeHomeHtml(c.engine.kicker)}</p><h2>${sanitizeHomeHtml(c.engine.titleHtml)}</h2></div><p>${sanitizeHomeHtml(c.engine.lead)}</p></div>
      <div class="engine-workbench">
        <div class="workbench-top"><div><span class="live-dot"></span>INTERACTIVE PROTOTYPE</div><small>입력 → 검색·검증 → RAG 생성 → 전문가 검토</small></div>
        <div class="engine-grid">
          <form id="ksic-form" class="brief-form">
            <label for="industry-input">사업·조사 내용 입력</label>
            <textarea id="industry-input" placeholder="예: 이차전지 제조기업의 인력 수요와 직무 역량을 조사하고 싶습니다.">이차전지 제조기업의 인력 수요와 직무 역량을 조사하고 싶습니다.</textarea>
            <div class="quick-brief"><button type="button" data-brief="스마트제조 기업의 생산성 향상과 현장 인력 수요를 조사합니다.">스마트제조</button><button type="button" data-brief="지역 대학 재학생의 교육 만족도와 취업 역량을 진단합니다.">교육 수요</button><button type="button" data-brief="공공기관 민원 응대 서비스의 친절도와 개선 과제를 진단합니다.">공공 CX</button></div>
            <button class="run-button" type="submit"><span>AI 매핑 실행</span><b>→</b></button>
            <p class="form-note">* 화면은 매핑·설문생성 흐름을 보여주는 체험형 프로토타입입니다.</p>
          </form>
          <div class="result-panel" aria-live="polite">
            <div class="result-top"><span>RAG ANALYSIS RESULT</span><b id="confidence">READY</b></div>
            <div id="result-empty" class="result-empty"><div class="radar"><i></i><i></i><i></i></div><p>조사 내용을 입력하고<br />AI 매핑을 실행해 보세요.</p></div>
            <div id="result-content" class="result-content" hidden>
              <p class="result-label">RECOMMENDED KSIC</p><div id="code-result" class="code-result"></div><div class="rationale"><span>근거 추출</span><p id="rationale-text"></p></div><div class="clarify"><b>AXI CHECK</b><p id="clarify-text"></p></div>
            </div>
          </div>
        </div>
      </div>
      <div class="pipeline"><div class="pipe-step active"><b>01</b><span>KSIC Master<br />Data Modeling</span></div><i></i><div class="pipe-step"><b>02</b><span>Retrieval &<br />Cross-validation</span></div><i></i><div class="pipe-step"><b>03</b><span>RAG / LLM Survey<br />Proposal × 3</span></div><i></i><div class="pipe-step"><b>04</b><span>Expert Review &<br />Survey Adoption</span></div></div>
    </section>`);
  }

  if (s.axi) {
    parts.push(`
    <section class="axi-section" id="axi">
      <div class="axi-copy"><p class="section-kicker">${sanitizeHomeHtml(c.axi.kicker)}</p><h2>${sanitizeHomeHtml(c.axi.titleHtml)}</h2><p>${sanitizeHomeHtml(c.axi.body)}</p><button class="btn-dark" data-open-axi>${sanitizeHomeHtml(c.axi.buttonLabel)} <b>↗</b></button></div>
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
      <div class="evidence-intro"><p class="section-kicker">${sanitizeHomeHtml(c.evidence.kicker)}</p><h2>${sanitizeHomeHtml(c.evidence.titleHtml)}</h2><p>${sanitizeHomeHtml(c.evidence.lead)}</p></div>
      <div class="metrics">${metricsHtml}</div>
      <div class="case-tabs" role="tablist" aria-label="수행영역"><button class="selected" role="tab" aria-selected="true" data-case="public">PUBLIC RESEARCH</button><button role="tab" aria-selected="false" data-case="cx">CX ANALYTICS</button><button role="tab" aria-selected="false" data-case="education">EDUCATION & DEMAND</button></div>
      <div class="case-panel" id="case-panel"><p class="case-number">01</p><div><h3>정책과 사업의 성과를<br />다음 실행계획으로 연결합니다.</h3><p>이해관계자 만족도·국민인식·청렴체감도·사업 성과 조사를 수행하며, 정량 결과와 현장 의견을 함께 분석해 개선 우선순위를 제공합니다.</p></div><ul><li>조사 설계 및 표본 설계</li><li>전문조사원 실사·품질 관리</li><li>원인 분석·개선과제 도출</li></ul></div>
      <div class="performance-records" aria-labelledby="performance-title">
        <div class="performance-title"><p class="section-kicker">${sanitizeHomeHtml(c.evidence.recordsKicker)}</p><h3 id="performance-title">${sanitizeHomeHtml(c.evidence.recordsTitle)}</h3><p>${sanitizeHomeHtml(c.evidence.recordsLead)}</p></div>
        <div class="performance-grid">${recordsHtml}</div>
      </div>
      <div class="operations-photo"><img src="${escAttr(c.evidence.opsImageUrl)}" alt="전문 조사 운영 현장" /><div><span>RESEARCH OPERATIONS</span><b>${sanitizeHomeHtml(c.evidence.opsTitleHtml)}</b><p>${sanitizeHomeHtml(c.evidence.opsBody)}</p></div></div>
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
    const address = c.contact.addressHtml.trim();
    const tel = phone.replace(/[^0-9+]/g, "");
    const detail =
      phone || address
        ? `<div><p>${
            phone ? `<a href="tel:${escAttr(tel)}">${sanitizeHomeHtml(phone)}</a>` : ""
          }</p><p>${sanitizeHomeHtml(address)}</p></div>`
        : "";
    const rowClass = detail ? "contact-row" : "contact-row contact-row-single";
    parts.push(`
    <section class="contact" id="contact">
      <p class="section-kicker">${sanitizeHomeHtml(c.contact.kicker)}</p>
      <h2>${sanitizeHomeHtml(c.contact.titleHtml)}</h2>
      <div class="${rowClass}">
        <a class="email-action" href="mailto:${escAttr(c.contact.email)}" aria-label="이메일로 문의하기">
          <span class="email-action-icon" aria-hidden="true">✉</span>
          <span><small>PROJECT INQUIRY</small><strong>${sanitizeHomeHtml(c.contact.emailButtonLabel)}</strong></span><b>↗</b>
        </a>
        ${detail}
      </div>
    </section>`);
  }

  parts.push("</main>");
  parts.push("</div>");

  return parts.join("\n");
}
