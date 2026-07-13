import "server-only";

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
};

export type SiteHomepageConfig = {
  siteName: string;
  siteNameFont: SiteNameFontKey;
  siteNameFontFamily: string;
  logoUrl: string | null;
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
  groups: [
    { key: "intro", label: "회사 소개", sortOrder: 0, items: [], guidePdfUrl: null, guideMediaType: null },
    { key: "survey", label: "설문 조사", sortOrder: 1, items: [], guidePdfUrl: null, guideMediaType: null },
    { key: "service", label: "서비스", sortOrder: 2, items: [], guidePdfUrl: null, guideMediaType: null },
  ],
};

export async function getSiteHomepageConfig(): Promise<SiteHomepageConfig> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return DEFAULT_CONFIG;
  }

  const admin = createSupabaseServiceRoleClient();

  let settings: { site_name?: string; logo_url?: string; site_name_font?: string } | null = null;
  let settingsError: { message: string } | null = null;

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

  const [groupsResult, { data: items, error: itemsError }] = await Promise.all([
    admin
      .from("site_nav_groups")
      .select("key, label, sort_order, guide_pdf_url, guide_media_type")
      .order("sort_order"),
    admin
      .from("site_nav_items")
      .select("id, group_key, label, href, sort_order, page_id")
      .order("sort_order", { ascending: true }),
  ]);

  let { data: groups, error: groupsError } = groupsResult;
  // guide_* 마이그레이션 전이면 컬럼 없이 재조회
  if (
    groupsError?.message.includes("guide_pdf_url") ||
    groupsError?.message.includes("guide_media_type")
  ) {
    const fallback = await admin
      .from("site_nav_groups")
      .select("key, label, sort_order")
      .order("sort_order");
    groups = fallback.data;
    groupsError = fallback.error;
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

  const groupRows = (groups ?? []) as {
    key: string;
    label: string;
    sort_order: number;
    guide_pdf_url?: string | null;
    guide_media_type?: string | null;
  }[];

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
        }))
      : DEFAULT_CONFIG.groups;

  return { siteName, siteNameFont, siteNameFontFamily, logoUrl, groups: builtGroups };
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
