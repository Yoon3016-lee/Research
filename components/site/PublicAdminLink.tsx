import Link from "next/link";
import {
  getPublicAdminLinkHref,
  isPublicAdminLinkExternal,
  isPublicAdminLinkVisible,
} from "@/lib/public-admin-link";

const footerClassName = "text-slate-400 transition hover:text-accent-400";

/** 서버 컴포넌트 — 푸터의 관리자 링크 */
export function PublicAdminFooterLink() {
  if (!isPublicAdminLinkVisible()) return null;
  const href = getPublicAdminLinkHref();
  if (isPublicAdminLinkExternal()) {
    return (
      <a href={href} className={footerClassName}>
        관리자
      </a>
    );
  }
  return (
    <Link href={href} className={footerClassName}>
      관리자
    </Link>
  );
}
