"use client";

import { useEffect, useRef, useState } from "react";
import { buildAboutCompanyHtml } from "@/lib/about-company-content";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap";

declare global {
  interface Window {
    PrimeAXAbout?: {
      init: (root: Element) => void;
    };
  }
}

function rewriteCssForHost(css: string): string {
  return css
    .replace(/@import\s+url\([^)]+\)\s*;?/g, "")
    .replace(/:root\s*\{/g, ".about-company-embed, :host{")
    .replace(/\bhtml\s*\{[^}]*\}/g, "")
    .replace(/\bbody\s*\{/g, ".about-company-embed, :host{")
    .replace(
      /\*\s*\{box-sizing:border-box\}/g,
      ":host, :host *, :host *::before, :host *::after, .about-company-embed, .about-company-embed *{box-sizing:border-box}",
    );
}

function loadAboutCompanyScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.PrimeAXAbout?.init) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    "script[data-primeax-about-script]",
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.PrimeAXAbout?.init) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("about-company.js 로드 실패")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/primeax-home/about-company.js?v=${Date.now()}`;
    script.async = true;
    script.dataset.primeaxAboutScript = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("about-company.js 로드 실패"));
    document.head.appendChild(script);
  });
}

export function AboutCompanyPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    (async () => {
      try {
        const cssText = await fetch("/primeax-home/about-company.css").then((r) => {
          if (!r.ok) throw new Error("about-company.css 로드 실패");
          return r.text();
        });

        if (cancelled) return;

        await loadAboutCompanyScript();
        if (cancelled) return;

        const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
        const css = rewriteCssForHost(cssText);
        const fragment = buildAboutCompanyHtml();

        shadow.innerHTML = `
          <link rel="stylesheet" href="${FONT_HREF}" />
          <style>
            :host {
              display: block;
              width: 100%;
              overflow-x: hidden;
              background: #f4f7fb;
              color: #0a2540;
              font-family: 'Manrope', 'Noto Sans KR', sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            ${css}
          </style>
          ${fragment}
        `;

        const root = shadow.querySelector("[data-primeax-about-root]");
        if (root) {
          window.PrimeAXAbout?.init(root);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "회사 소개 화면을 불러오지 못했습니다.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="px-4 py-16 text-center text-brand-800">
        <p>회사 소개 화면을 표시하는 중 문제가 발생했습니다.</p>
        <p className="mt-2 text-sm text-brand-700/80">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="about-company-host w-full min-h-[50vh] bg-[#f4f7fb]"
      data-primeax-about-company
    />
  );
}
