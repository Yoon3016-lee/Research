import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** 공개 사이트 본문 배경 */
export function SiteVisualFrame({ children }: Props) {
  return (
    <div className="site-visual-frame relative flex-1">
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
