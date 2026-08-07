/**
 * PRIME AX 홈 랜딩 인터랙션 (Shadow DOM 루트 기준)
 */
export type PrimeaxHomeCleanup = () => void;

export function initPrimeaxHome(root: ParentNode): PrimeaxHomeCleanup {
  const cleanups: Array<() => void> = [];

  const input = root.querySelector<HTMLTextAreaElement>("#industry-input");
  root.querySelectorAll<HTMLButtonElement>("[data-brief]").forEach((button) => {
    const onClick = () => {
      if (!input) return;
      input.value = button.dataset.brief ?? "";
      input.focus();
    };
    button.addEventListener("click", onClick);
    cleanups.push(() => button.removeEventListener("click", onClick));
  });

  const libraries = [
    {
      terms: ["이차전지", "배터리", "전지", "전기차"],
      codes: [
        ["28202", "축전지 제조업"],
        ["C28", "전기장비 제조업"],
        ["M71", "전문 연구개발업"],
      ],
      reason:
        "이차전지·제조·인력수요 키워드를 기반으로 전기장비 제조업 컨텍스트를 우선 검색했습니다.",
      check:
        "생산공정·소재·재활용 중 조사 초점을 선택하면 설문 문항의 정밀도를 높일 수 있습니다.",
    },
    {
      terms: ["교육", "대학", "학생", "취업", "과정"],
      codes: [
        ["85302", "대학교"],
        ["M70", "연구개발업"],
        ["P85", "교육 서비스업"],
      ],
      reason:
        "교육과정·학습자·역량 진단 맥락을 기준으로 교육 서비스와 수요조사 모듈을 연결했습니다.",
      check:
        "재학생·졸업생·산업체 중 핵심 응답 대상을 정하면 표본 설계를 제안할 수 있습니다.",
    },
    {
      terms: ["민원", "친절", "공공", "서비스", "만족"],
      codes: [
        ["O84", "공공행정"],
        ["M71", "전문 연구개발업"],
        ["N75", "사업 지원 서비스업"],
      ],
      reason:
        "공공 서비스·민원 응대·만족도 키워드를 분석해 공공행정과 CX 측정 템플릿을 연결했습니다.",
      check:
        "전화·방문·온라인 중 평가 채널을 선택하면 문항 및 평가기준을 맞춤 생성할 수 있습니다.",
    },
    {
      terms: ["제조", "스마트", "생산", "공장"],
      codes: [
        ["C29", "기타 기계 및 장비 제조업"],
        ["C25", "금속가공제품 제조업"],
        ["M71", "전문 연구개발업"],
      ],
      reason:
        "스마트제조·생산성·현장인력 맥락을 기반으로 제조 산업분류와 역량수요 모듈을 검색했습니다.",
      check:
        "대상 기업의 주력 생산품을 추가하면 KSIC 후보의 적합도를 보완할 수 있습니다.",
    },
  ];

  const form = root.querySelector<HTMLFormElement>("#ksic-form");
  const result = root.querySelector<HTMLElement>("#result-content");
  const empty = root.querySelector<HTMLElement>("#result-empty");
  const onSubmit = (event: Event) => {
    event.preventDefault();
    const text = input?.value.trim() ?? "";
    if (!text || !result || !empty) return;
    const found =
      libraries.find((item) => item.terms.some((t) => text.includes(t))) ??
      libraries[3];
    const codeBox = root.querySelector("#code-result");
    if (codeBox) {
      codeBox.innerHTML = found.codes
        .map(
          ([code, name]) =>
            `<div class="code-card"><b>${code}</b><span>${name}</span></div>`,
        )
        .join("");
    }
    const rationale = root.querySelector("#rationale-text");
    const clarify = root.querySelector("#clarify-text");
    const confidence = root.querySelector("#confidence");
    if (rationale) rationale.textContent = found.reason;
    if (clarify) clarify.textContent = found.check;
    if (confidence) confidence.textContent = "93% MATCH";
    empty.hidden = true;
    result.hidden = false;
    result.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 350, fill: "forwards" },
    );
  };
  form?.addEventListener("submit", onSubmit);
  if (form) cleanups.push(() => form.removeEventListener("submit", onSubmit));

  const cases: Record<
    string,
    { number: string; title: string; desc: string; items: string[] }
  > = {
    public: {
      number: "01",
      title: "정책과 사업의 성과를<br />다음 실행계획으로 연결합니다.",
      desc: "이해관계자 만족도·국민인식·청렴체감도·사업 성과 조사를 수행하며, 정량 결과와 현장 의견을 함께 분석해 개선 우선순위를 제공합니다.",
      items: ["조사 설계 및 표본 설계", "전문조사원 실사·품질 관리", "원인 분석·개선과제 도출"],
    },
    cx: {
      number: "02",
      title: "고객 경험의 빈틈을<br />측정하고 개선의 순서를 정합니다.",
      desc: "고객만족도, 전화친절도, VOC, 미스터리쇼퍼를 통해 실제 고객 여정을 진단하고 서비스 품질의 개선 과제를 구체화합니다.",
      items: ["CX 지표·평가표 설계", "현장 모니터링 및 증빙 검토", "개선 우선순위·KPI 제안"],
    },
    education: {
      number: "03",
      title: "학습자와 산업체의 요구를<br />교육과정 개편으로 연결합니다.",
      desc: "교육수요·핵심역량·사업성과 조사를 통해 대학, 산업체, 학습자의 목소리를 통합하고 교육사업의 다음 의사결정을 지원합니다.",
      items: ["이해관계자별 조사 설계", "정량·정성 통합 분석", "과정 개편·확대 근거 제시"],
    },
  };

  root.querySelectorAll<HTMLButtonElement>("[data-case]").forEach((button) => {
    const onClick = () => {
      root.querySelectorAll<HTMLButtonElement>("[data-case]").forEach((x) => {
        x.classList.remove("selected");
        x.setAttribute("aria-selected", "false");
      });
      button.classList.add("selected");
      button.setAttribute("aria-selected", "true");
      const data = cases[button.dataset.case ?? ""];
      const panel = root.querySelector("#case-panel");
      if (!data || !panel) return;
      panel.innerHTML = `<p class="case-number">${data.number}</p><div><h3>${data.title}</h3><p>${data.desc}</p></div><ul>${data.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
      panel.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 250 });
    };
    button.addEventListener("click", onClick);
    cleanups.push(() => button.removeEventListener("click", onClick));
  });

  const modal = root.querySelector<HTMLElement>("#axi-modal");
  const chat = root.querySelector("#assistant-chat");
  const answers: Record<string, string> = {
    "만족도 조사":
      "조사 목적, 핵심 고객군, 서비스 접점을 알려주시면 KPI와 문항 구조를 우선 제안합니다.",
    "KSIC 매핑":
      "사업체명·업종 설명을 입력하면 후보 코드, 판단 근거, 추가 확인 질문을 정리합니다.",
    "전화 친절도":
      "평가 채널과 업무 유형에 맞춰 경청·설명정확성·해결노력 등 루브릭을 구성합니다.",
  };

  root.querySelectorAll("[data-open-axi]").forEach((b) => {
    const onClick = () => {
      modal?.classList.add("open");
      modal?.setAttribute("aria-hidden", "false");
    };
    b.addEventListener("click", onClick);
    cleanups.push(() => b.removeEventListener("click", onClick));
  });

  const closeBtn = root.querySelector(".close-modal");
  const onClose = () => {
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
  };
  closeBtn?.addEventListener("click", onClose);
  if (closeBtn) cleanups.push(() => closeBtn.removeEventListener("click", onClose));

  const onModalBg = (e: Event) => {
    if (e.target === modal) onClose();
  };
  modal?.addEventListener("click", onModalBg);
  if (modal) cleanups.push(() => modal.removeEventListener("click", onModalBg));

  root.querySelectorAll<HTMLButtonElement>(".suggestions button").forEach((b) => {
    const onClick = () => {
      const key = b.textContent?.trim() ?? "";
      if (!chat || !key) return;
      chat.insertAdjacentHTML(
        "beforeend",
        `<p class="user">${key}</p><p class="bot">${answers[key] ?? "관련 안내를 준비 중입니다."}</p>`,
      );
      chat.scrollTop = chat.scrollHeight;
    };
    b.addEventListener("click", onClick);
    cleanups.push(() => b.removeEventListener("click", onClick));
  });

  const revealSections = root.querySelectorAll(".scroll-reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );
  revealSections.forEach((section) => revealObserver.observe(section));
  cleanups.push(() => revealObserver.disconnect());

  const bannerScore = root.querySelector<HTMLElement>("[data-banner-score]");
  let scoreTimer: ReturnType<typeof setInterval> | null = null;
  if (
    bannerScore &&
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    const liveValues = [83, 86, 89, 92, 94, 91, 96, 93];
    let liveIndex = 0;
    const animateBannerScore = (target: number) => {
      const start = Number(bannerScore.textContent) || liveValues[0];
      const started = performance.now();
      const update = (now: number) => {
        const progress = Math.min((now - started) / 620, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        bannerScore.textContent = String(Math.round(start + (target - start) * eased));
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };
    scoreTimer = setInterval(() => {
      if (document.hidden) return;
      liveIndex = (liveIndex + 1) % liveValues.length;
      animateBannerScore(liveValues[liveIndex]);
    }, 1800);
    cleanups.push(() => {
      if (scoreTimer) clearInterval(scoreTimer);
    });
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
