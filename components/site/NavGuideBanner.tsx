"use client";

import { usePathname } from "next/navigation";

export type NavGuideLink = {
  href: string;
  label: string;
};

export type NavGuideItem = {
  key: string;
  label: string;
  links: NavGuideLink[];
  guidePdfUrl: string;
  guideMediaType: "image" | "pdf";
};

type Props = {
  items: NavGuideItem[];
};

function matchLength(pathname: string, href: string): number {
  if (href === "/") {
    return pathname === "/" ? 1 : -1;
  }
  if (pathname === href || pathname.startsWith(`${href}/`)) {
    return href.length;
  }
  return -1;
}

function normalizePath(href: string): string {
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  return path.replace(/\/+$/, "") || "/";
}

export function NavGuideBanner({ items }: Props) {
  const pathname = usePathname();
  const path = normalizePath(pathname);

  let bestGroup: NavGuideItem | null = null;
  let bestLink: NavGuideLink | null = null;
  let bestLen = -1;

  for (const item of items) {
    for (const link of item.links) {
      const len = matchLength(path, normalizePath(link.href));
      if (len > bestLen) {
        bestLen = len;
        bestGroup = item;
        bestLink = link;
      }
    }
  }

  if (!bestGroup || !bestLink) return null;

  const title = bestLink.label.trim() || bestGroup.label;

  return (
    <section
      className="relative z-0 w-full overflow-hidden bg-slate-900"
      aria-label={`${bestGroup.label} 안내`}
    >
      <div className="relative mx-auto w-[var(--site-banner-max)] max-w-full">
        {bestGroup.guideMediaType === "pdf" ? (
          <iframe
            title={`${bestGroup.label} 안내`}
            src={bestGroup.guidePdfUrl}
            className="aspect-[8/1] min-h-[7rem] w-full border-0 bg-slate-800 sm:min-h-[9rem]"
            aria-hidden
          />
        ) : (
          <div className="aspect-[8/1] min-h-[7rem] w-full overflow-hidden bg-slate-800 sm:min-h-[9rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bestGroup.guidePdfUrl}
              alt=""
              className="block h-full w-full object-cover object-center"
            />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/35 via-black/25 to-black/40 px-4">
          <h1 className="max-w-[var(--site-content-max)] text-center text-[2.25rem] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-[2.8125rem]">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
