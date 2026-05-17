/**
 * 공개(참여자) 사이트 헤더·푸터의 관리자 진입 표시.
 * 배포 시 공개 도메인에서는 숨기고, 운영자는 관리자 전용 도메인으로만 접속합니다.
 */
export type PublicAdminLinkConfig = {
  show: boolean;
  href: string;
  external: boolean;
};

export function getPublicAdminLinkConfig(): PublicAdminLinkConfig {
  return {
    show: isPublicAdminLinkVisible(),
    href: getPublicAdminLinkHref(),
    external: isPublicAdminLinkExternal(),
  };
}

export function isPublicAdminLinkVisible(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_PUBLIC_ADMIN_LINK !== "false";
}

/** 표시할 때 이동 URL. 미설정 시 같은 앱의 `/admin` (로컬 개발용). */
export function getPublicAdminLinkHref(): string {
  const raw = process.env.NEXT_PUBLIC_ADMIN_SITE_URL?.trim();
  if (!raw) return "/admin";
  return raw.replace(/\/$/, "");
}

export function isPublicAdminLinkExternal(): boolean {
  const href = getPublicAdminLinkHref();
  return href.startsWith("http://") || href.startsWith("https://");
}
