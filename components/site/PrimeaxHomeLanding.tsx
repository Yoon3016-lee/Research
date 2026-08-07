"use client";

import { useEffect, useRef, useState } from "react";
import { initPrimeaxHome } from "@/components/site/primeax-home/initPrimeaxHome";
import {
  buildPublicHomeHtml,
  type PublicHomeContent,
} from "@/lib/public-home-content";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap";

function rewriteCssForHost(css: string): string {
  return css
    .replace(/:root\s*\{/g, ":host{")
    .replace(/\bhtml\s*\{[^}]*\}/g, "")
    .replace(/\bbody\s*\{/g, ":host{")
    .replace(
      /\*\s*\{box-sizing:border-box\}/g,
      ":host, :host *, :host *::before, :host *::after{box-sizing:border-box}",
    );
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
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [styles, overrides] = await Promise.all([
          fetch("/primeax-home/styles.css").then((r) => {
            if (!r.ok) throw new Error("styles.css 로드 실패");
            return r.text();
          }),
          fetch("/primeax-home/overrides.css").then((r) => {
            if (!r.ok) throw new Error("overrides.css 로드 실패");
            return r.text();
          }),
        ]);

        if (cancelled) return;

        const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
        const css = rewriteCssForHost(`${styles}\n${overrides}`);
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
            a { text-decoration: none; color: inherit; }
            button { font: inherit; cursor: pointer; }
            h1, h2, h3, p { margin-top: 0; }
            [id] { scroll-margin-top: calc(var(--site-header-height, 4.5rem) + 12px); }
            .hero.banner-hero {
              scroll-margin-top: calc(var(--site-header-height, 4.5rem) + 8px);
            }
            ${css}
          </style>
          ${fragment}
        `;

        cleanup = initPrimeaxHome(shadow);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "홈 시안을 불러오지 못했습니다.");
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
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
