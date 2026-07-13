"use client";

import { usePathname } from "next/navigation";

export type NavGuideItem = {
  key: string;
  label: string;
  hrefs: string[];
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

export function NavGuideBanner({ items }: Props) {
  const pathname = usePathname();

  let best: NavGuideItem | null = null;
  let bestLen = -1;
  for (const item of items) {
    for (const href of item.hrefs) {
      const len = matchLength(pathname, href);
      if (len > bestLen) {
        bestLen = len;
        best = item;
      }
    }
  }

  if (!best) return null;

  return (
    <section
      className="relative z-0 w-full border-b border-slate-200 bg-white"
      aria-label={`${best.label} 안내`}
    >
      {best.guideMediaType === "pdf" ? (
        <iframe
          title={`${best.label} 안내`}
          src={best.guidePdfUrl}
          className="aspect-[8/1] min-h-[4.5rem] w-full border-0 bg-slate-50"
        />
      ) : (
        <div className="aspect-[8/1] min-h-[4.5rem] w-full overflow-hidden bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={best.guidePdfUrl}
            alt={`${best.label} 안내`}
            className="block h-full w-full object-fill"
          />
        </div>
      )}
    </section>
  );
}
