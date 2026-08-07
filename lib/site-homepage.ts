import "server-only";

import {
  DEFAULT_AXI_ALLOWED_ROLES,
  parseAxiAllowedRoles,
} from "@/lib/axi/access";
import {
  DEFAULT_PUBLIC_HOME_CONTENT,
  parsePublicHomeContent,
  type PublicHomeContent,
} from "@/lib/public-home-content";
import {
  DEFAULT_SITE_NAME_FONT,
  getSiteNameFontOption,
  parseSiteNameFontKey,
  type SiteNameFontKey,
} from "@/lib/site-name-fonts";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SiteNavGroupKey = string;

export type SiteNavGuideMediaType = "image" | "pdf";

export type SiteNavItem = {
  id: string;
  groupKey: string;
  label: string;
  href: string;
  sortOrder: number;
  pageId: string | null;
};

export type SiteNavGroup = {
  key: string;
  label: string;
  sortOrder: number;
  items: SiteNavItem[];
  guidePdfUrl: string | null;
  guideMediaType: SiteNavGuideMediaType | null;
  /** 설정 시 상단 탭이 드롭다운 대신 이 경로로 바로 이동 */
  href: string;
};

export type SiteHomepageConfig = {
  siteName: string;
  siteNameFont: SiteNameFontKey;
  siteNameFontFamily: string;
  logoUrl: string | null;
  /** 설문·공개 사이트 AXI 플로팅 아이콘 */
  axiIconUrl: string | null;
  /** AXI를 사용할 수 있는 역할 키 (anonymous + profiles.role) */
  axiAllowedRoles: string[];
  groups: SiteNavGroup[];
};

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  body: string;
};

const DEFAULT_CONFIG: SiteHomepageConfig = {
  siteName: "[ OO리서치 ]",
  siteNameFont: DEFAULT_SITE_NAME_FONT,
  siteNameFontFamily: getSiteNameFontOption(DEFAULT_SITE_NAME_FONT).fontFamily,
  logoUrl: null,
  axiIconUrl: null,
  axiAllowedRoles: [...DEFAULT_AXI_ALLOWED_ROLES],
  groups: [
    { key: "intro", label: "회사 소개", sortOrder: 0, items: [], guidePdfUrl: null, guideMediaType: null, href: "" },
    { key: "survey", label: "설문 조사", sortOrder: 1, items: [], guidePdfUrl: null, guideMediaType: null, href: "" },
    { key: "service", label: "서비스", sortOrder: 2, items: [], guidePdfUrl: null, guideMediaType: null, href: "" },
  ],
};

export async function getSiteHomepageConfig(): Promise<SiteHomepageConfig> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return DEFAULT_CONFIG;
  }

  const admin = createSupabaseServiceRoleClient();

  let settings: {
    site_name?: string;
    logo_url?: string;
    site_name_font?: string;
    axi_icon_url?: string | null;
    axi_allowed_roles?: string[] | null;
  } | null = null;
  let settingsError: { message: string } | null = null;

  const settingsWithAxiRoles = await admin
    .from("site_settings")
    .select("site_name, logo_url, site_name_font, axi_icon_url, axi_allowed_roles")
    .eq("id", 1)
    .maybeSingle();

  if (settingsWithAxiRoles.error?.message.includes("axi_allowed_roles")) {
    const settingsWithAxi = await admin
      .from("site_settings")
      .select("site_name, logo_url, site_name_font, axi_icon_url")
      .eq("id", 1)
      .maybeSingle();

    if (settingsWithAxi.error?.message.includes("axi_icon_url")) {
      const settingsWithFont = await admin
        .from("site_settings")
        .select("site_name, logo_url, site_name_font")
        .eq("id", 1)
        .maybeSingle();

      if (settingsWithFont.error?.message.includes("site_name_font")) {
        const settingsWithLogo = await admin
          .from("site_settings")
          .select("site_name, logo_url")
          .eq("id", 1)
          .maybeSingle();

        if (settingsWithLogo.error?.message.includes("logo_url")) {
          const fallback = await admin
            .from("site_settings")
            .select("site_name")
            .eq("id", 1)
            .maybeSingle();
          settings = fallback.data;
          settingsError = fallback.error;
        } else {
          settings = settingsWithLogo.data;
          settingsError = settingsWithLogo.error;
        }
      } else if (settingsWithFont.error?.message.includes("logo_url")) {
        const fallback = await admin
          .from("site_settings")
          .select("site_name, site_name_font")
          .eq("id", 1)
          .maybeSingle();
        settings = fallback.data;
        settingsError = fallback.error;
      } else {
        settings = settingsWithFont.data;
        settingsError = settingsWithFont.error;
      }
    } else {
      settings = settingsWithAxi.data;
      settingsError = settingsWithAxi.error;
    }
  } else if (settingsWithAxiRoles.error?.message.includes("axi_icon_url")) {
    const settingsWithFont = await admin
      .from("site_settings")
      .select("site_name, logo_url, site_name_font")
      .eq("id", 1)
      .maybeSingle();
    settings = settingsWithFont.data;
    settingsError = settingsWithFont.error;
  } else {
    settings = settingsWithAxiRoles.data;
    settingsError = settingsWithAxiRoles.error;
  }

  const [groupsResult, { data: items, error: itemsError }] = await Promise.all([
    admin
      .from("site_nav_groups")
      .select("key, label, sort_order, guide_pdf_url, guide_media_type, href")
      .order("sort_order"),
    admin
      .from("site_nav_items")
      .select("id, group_key, label, href, sort_order, page_id")
      .order("sort_order", { ascending: true }),
  ]);

  let groupsError = groupsResult.error;
  let groupRows: {
    key: string;
    label: string;
    sort_order: number;
    guide_pdf_url?: string | null;
    guide_media_type?: string | null;
    href?: string | null;
  }[];

  // guide_* / href 마이그레이션 전이면 컬럼 없이 재조회
  if (
    groupsError?.message.includes("guide_pdf_url") ||
    groupsError?.message.includes("guide_media_type") ||
    groupsError?.message.includes("href")
  ) {
    const fallback = await admin
      .from("site_nav_groups")
      .select("key, label, sort_order, guide_pdf_url, guide_media_type")
      .order("sort_order");
    if (
      fallback.error?.message.includes("guide_pdf_url") ||
      fallback.error?.message.includes("guide_media_type")
    ) {
      const basic = await admin
        .from("site_nav_groups")
        .select("key, label, sort_order")
        .order("sort_order");
      groupRows = basic.data ?? [];
      groupsError = basic.error;
    } else {
      groupRows = fallback.data ?? [];
      groupsError = fallback.error;
    }
  } else {
    groupRows = groupsResult.data ?? [];
  }

  if (settingsError) {
    console.error("[getSiteHomepageConfig] site_settings:", settingsError.message);
  }
  if (groupsError) {
    console.error("[getSiteHomepageConfig] site_nav_groups:", groupsError.message);
  }
  if (itemsError) {
    console.error("[getSiteHomepageConfig] site_nav_items:", itemsError.message);
  }

  const siteName =
    (settings?.site_name as string | undefined)?.trim() || DEFAULT_CONFIG.siteName;
  const siteNameFont = parseSiteNameFontKey(settings?.site_name_font);
  const siteNameFontFamily = getSiteNameFontOption(siteNameFont).fontFamily;
  const logoRaw = (settings?.logo_url as string | undefined)?.trim();
  const logoUrl = logoRaw || null;
  const axiIconRaw = (settings?.axi_icon_url as string | undefined)?.trim();
  const axiIconUrl = axiIconRaw || null;
  const axiAllowedRoles = parseAxiAllowedRoles(settings?.axi_allowed_roles);

  const itemRows = (items ?? []) as {
    id: string;
    group_key: string;
    label: string;
    href: string;
    sort_order: number;
    page_id: string | null;
  }[];

  const groupKeySet = new Set(groupRows.map((g) => g.key));

  const itemsByGroup = new Map<string, SiteNavItem[]>();
  for (const row of itemRows) {
    if (!groupKeySet.has(row.group_key)) continue;
    const list = itemsByGroup.get(row.group_key) ?? [];
    list.push({
      id: row.id,
      groupKey: row.group_key,
      label: row.label,
      href: row.href,
      sortOrder: row.sort_order,
      pageId: row.page_id,
    });
    itemsByGroup.set(row.group_key, list);
  }

  const builtGroups: SiteNavGroup[] =
    groupRows.length > 0
      ? groupRows.map((g) => ({
          key: g.key,
          label: g.label,
          sortOrder: g.sort_order,
          items: itemsByGroup.get(g.key) ?? [],
          guidePdfUrl: g.guide_pdf_url ?? null,
          guideMediaType:
            g.guide_media_type === "image" || g.guide_media_type === "pdf"
              ? g.guide_media_type
              : g.guide_pdf_url
                ? "pdf"
                : null,
          href: typeof g.href === "string" ? g.href.trim() : "",
        }))
      : DEFAULT_CONFIG.groups;

  return {
    siteName,
    siteNameFont,
    siteNameFontFamily,
    logoUrl,
    axiIconUrl,
    axiAllowedRoles,
    groups: builtGroups,
  };
}

export async function getPublicHomeContent(): Promise<PublicHomeContent> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return structuredClone(DEFAULT_PUBLIC_HOME_CONTENT);
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("public_home_content")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (!error.message.includes("public_home_content")) {
      console.error("[getPublicHomeContent]", error.message);
    }
    return structuredClone(DEFAULT_PUBLIC_HOME_CONTENT);
  }

  return parsePublicHomeContent(data?.public_home_content);
}

export async function getSitePagesByIds(ids: string[]): Promise<Record<string, SitePage>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {};
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_pages")
    .select("id, slug, title, body")
    .in("id", unique);

  if (error || !data) return {};

  const map: Record<string, SitePage> = {};
  for (const row of data) {
    map[row.id as string] = {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      body: (row.body as string) ?? "",
    };
  }
  return map;
}

export async function getSitePageBySlug(slug: string): Promise<SitePage | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_pages")
    .select("id, slug, title, body")
    .eq("slug", normalized)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    slug: data.slug as string,
    title: data.title as string,
    body: (data.body as string) ?? "",
  };
}

export type SiteNavTrail = {
  groupLabel: string;
  itemLabel: string;
};

function normalizeNavPath(href: string): string {
  try {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return new URL(href).pathname.replace(/\/+$/, "") || "/";
    }
  } catch {
    /* ignore */
  }
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  return path.replace(/\/+$/, "") || "/";
}

/** 현재 CMS 페이지에 연결된 상단 탭·하단 메뉴 라벨을 찾습니다. */
export function findSiteNavTrailForPage(
  groups: SiteNavGroup[],
  page: Pick<SitePage, "id" | "slug">,
): SiteNavTrail | null {
  const pagePath = `/p/${page.slug}`;

  for (const group of groups) {
    for (const item of group.items) {
      const byPageId = item.pageId != null && item.pageId === page.id;
      const byHref = normalizeNavPath(item.href) === pagePath;
      if (byPageId || byHref) {
        return {
          groupLabel: group.label.trim() || group.key,
          itemLabel: item.label.trim() || page.slug,
        };
      }
    }
  }

  return null;
}

/** 경로(href)에 연결된 상단 탭·하단 메뉴 라벨을 찾습니다. 예: /surveys */
export function findSiteNavTrailForHref(
  groups: SiteNavGroup[],
  href: string,
): SiteNavTrail | null {
  const path = normalizeNavPath(href);
  if (!path) return null;

  for (const group of groups) {
    for (const item of group.items) {
      if (normalizeNavPath(item.href) === path) {
        return {
          groupLabel: group.label.trim() || group.key,
          itemLabel: item.label.trim() || path,
        };
      }
    }
  }

  return null;
}

export type SiteNavGuideMatch = {
  groupKey: string;
  groupLabel: string;
  itemLabel: string;
  guidePdfUrl: string;
  guideMediaType: SiteNavGuideMediaType;
};

/**
 * 현재 경로에 표시할 상단 탭 안내 배너(가이드)와 하단 메뉴 제목을 찾습니다.
 * 배너가 없으면 null — 페이지에서 제목을 별도 출력합니다.
 */
export function findSiteNavGuideMatch(
  groups: SiteNavGroup[],
  href: string,
): SiteNavGuideMatch | null {
  const path = normalizeNavPath(href);
  if (!path) return null;

  let best: SiteNavGuideMatch | null = null;
  let bestLen = -1;

  for (const group of groups) {
    if (!group.guidePdfUrl) continue;
    for (const item of group.items) {
      const itemPath = normalizeNavPath(item.href);
      let len = -1;
      if (itemPath === "/") {
        len = path === "/" ? 1 : -1;
      } else if (path === itemPath || path.startsWith(`${itemPath}/`)) {
        len = itemPath.length;
      }
      if (len > bestLen) {
        bestLen = len;
        best = {
          groupKey: group.key,
          groupLabel: group.label.trim() || group.key,
          itemLabel: item.label.trim() || itemPath,
          guidePdfUrl: group.guidePdfUrl,
          guideMediaType: group.guideMediaType ?? "pdf",
        };
      }
    }
  }

  return best;
}
