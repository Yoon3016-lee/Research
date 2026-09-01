"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildPublicHomeHtml,
  type PublicHomeContent,
} from "@/lib/public-home-content";
import {
  isPlatformAxiAvailable,
  requestOpenAxi,
} from "@/lib/axi/open-event";
import { scrollToPrimeaxSectionWhenReady } from "@/lib/primeax-public-chrome";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap";

declare global {
  interface Window {
    PrimeAX?: {
      init: (root: Element) => void;
    };
  }
}

function rewriteCssForHost(css: string): string {
  return css
    .replace(/@import\s+url\([^)]+\)\s*;?/g, "")
    .replace(/:root\s*\{/g, ".primeax-embed, :host{")
    .replace(/\bhtml\s*\{[^}]*\}/g, "")
    .replace(/\bbody\s*\{/g, ".primeax-embed, :host{")
    .replace(
      /\*\s*\{box-sizing:border-box\}/g,
      ":host, :host *, :host *::before, :host *::after, .primeax-embed, .primeax-embed *{box-sizing:border-box}",
    );
}

function loadPrimeaxScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.PrimeAX?.init) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>("script[data-primeax-home-script]");
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.PrimeAX?.init) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("script.js 로드 실패")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/primeax-home/script.js?v=${Date.now()}`;
    script.async = true;
    script.dataset.primeaxHomeScript = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("script.js 로드 실패"));
    document.head.appendChild(script);
  });
}

type Props = {
  content: PublicHomeContent;
};

export function PrimeaxHomeLanding({ content }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let removeAxiListener: (() => void) | undefined;

    (async () => {
      try {
        const [stylesEntry, core, overrides, executionRoadmap] = await Promise.all([
          fetch("/primeax-home/styles.css").then((r) => {
            if (!r.ok) throw new Error("styles.css 로드 실패");
            return r.text();
          }),
          fetch("/primeax-home/core.css").then((r) => {
            if (!r.ok) throw new Error("core.css 로드 실패");
            return r.text();
          }),
          fetch("/primeax-home/overrides.css").then((r) => {
            if (!r.ok) throw new Error("overrides.css 로드 실패");
            return r.text();
          }),
          fetch("/primeax-home/execution-roadmap.css").then((r) => {
            if (!r.ok) throw new Error("execution-roadmap.css 로드 실패");
            return r.text();
          }),
        ]);

        if (cancelled) return;

        await loadPrimeaxScript();
        if (cancelled) return;

        const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
        const css = rewriteCssForHost(
          `${stylesEntry}\n${core}\n${overrides}\n${executionRoadmap}`,
        );
        const fragment = buildPublicHomeHtml(content);

        shadow.innerHTML = `
          <link rel="stylesheet" href="${FONT_HREF}" />
          <style>
            :host {
              display: block;
              width: 100%;
              overflow-x: hidden;
              background: #f7fbff;
              color: #132f56;
              font-family: 'Manrope', 'Noto Sans KR', sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .site-header, .site-footer, footer.site-footer { display: none !important; }
            [id] { scroll-margin-top: calc(var(--site-header-height, 4.5rem) + 12px); }
            .hero.banner-hero {
              scroll-margin-top: 0;
            }
            ${css}
          </style>
          ${fragment}
        `;

        const root =
          shadow.querySelector<HTMLElement>("[data-primeax-root]") ??
          shadow.querySelector<HTMLElement>("#main")?.parentElement;
        if (root) {
          delete root.dataset.primeaxReady;
          window.PrimeAX?.init(root);
        }

        const hash = window.location.hash.replace(/^#/, "");
        if (hash) scrollToPrimeaxSectionWhenReady(hash);

        const onOpenAxi = (event: Event) => {
          event.preventDefault();
          if (isPlatformAxiAvailable()) {
            requestOpenAxi();
            return;
          }
          window.alert("AXI는 권한이 있는 계정으로 로그인한 뒤 이용할 수 있습니다.");
        };
        host.addEventListener("primeax:open-axi", onOpenAxi);
        removeAxiListener = () => host.removeEventListener("primeax:open-axi", onOpenAxi);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "홈 시안을 불러오지 못했습니다.");
        }
      }
    })();

    return () => {
      cancelled = true;
      removeAxiListener?.();
    };
  }, [content]);

  if (error) {
    return (
      <div className="px-4 py-16 text-center text-brand-800">
        <p>메인 화면을 표시하는 중 문제가 발생했습니다.</p>
        <p className="mt-2 text-sm text-brand-700/80">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="primeax-home-host w-full min-h-[50vh] bg-[#f7fbff]"
      data-primeax-home
    />
  );
}
