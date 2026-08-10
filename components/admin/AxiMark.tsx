"use client";

import { Sparkles } from "lucide-react";

type Props = {
  axiIconUrl?: string | null;
  /** 아이콘 박스 한 변(px 클래스) */
  sizeClassName?: string;
  className?: string;
};

/** 홈페이지 기타관리 AXI 아이콘. 없으면 Sparkles 폴백 */
export function AxiMark({
  axiIconUrl,
  sizeClassName = "h-5 w-5",
  className = "",
}: Props) {
  if (axiIconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={axiIconUrl}
        alt=""
        className={`${sizeClassName} shrink-0 object-contain ${className}`.trim()}
        aria-hidden
      />
    );
  }
  return (
    <Sparkles
      className={`${sizeClassName} shrink-0 text-current ${className}`.trim()}
      aria-hidden
    />
  );
}
