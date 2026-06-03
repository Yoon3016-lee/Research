import type { ReactNode } from "react";

const widthClass = {
  /** 헤더·푸터·홈·목록 등 기본 폭 */
  page: "max-w-[var(--site-content-max)]",
  /** CMS 글 페이지 */
  article: "max-w-5xl",
  /** 설문 참여 */
  survey: "max-w-4xl",
  /** 완료·안내 등 좁은 화면 */
  narrow: "max-w-2xl",
} as const;

type Width = keyof typeof widthClass;

type Props = {
  children: ReactNode;
  as?: "div" | "main" | "section";
  width?: Width;
  className?: string;
};

export function SiteContainer({
  children,
  as: Tag = "div",
  width = "page",
  className = "",
}: Props) {
  return (
    <Tag
      className={`site-container mx-auto w-full ${widthClass[width]} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
