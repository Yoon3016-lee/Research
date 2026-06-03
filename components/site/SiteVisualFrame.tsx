import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** 공개 사이트 본문 — 좌우 세로 라인 + 배경 */
export function SiteVisualFrame({ children }: Props) {
  return (
    <div className="site-visual-frame relative flex-1">
      <div className="site-side-rail site-side-rail-left" aria-hidden />
      <div className="site-side-rail site-side-rail-right" aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
