import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

/** 기본 시드 데이터용 (DB에 그룹이 없을 때만 사용) */
export const DEFAULT_NAV_GROUP_KEYS = ["intro", "survey", "service"] as const;

export type SiteNavGroupKey = string;

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
};

export type SiteHomepageConfig = {
  siteName: string;
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
  logoUrl: null,
  groups: [
    { key: "intro", label: "회사 소개", sortOrder: 0, items: [] },
    { key: "survey", label: "설문 조사", sortOrder: 1, items: [] },
    { key: "service", label: "서비스", sortOrder: 2, items: [] },
  ],
};

export async function getSiteHomepageConfig(): Promise<SiteHomepageConfig> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return DEFAULT_CONFIG;
  }

  const admin = createSupabaseServiceRoleClient();

  let settings: { site_name?: string; logo_url?: string } | null = null;
  let settingsError: { message: string } | null = null;

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

  const [
    { data: groups, error: groupsError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    admin.from("site_nav_groups").select("key, label, sort_order").order("sort_order"),
    admin
      .from("site_nav_items")
      .select("id, group_key, label, href, sort_order, page_id")
      .order("sort_order", { ascending: true }),
  ]);

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
  const logoRaw = (settings?.logo_url as string | undefined)?.trim();
  const logoUrl = logoRaw || null;

  const groupRows = (groups ?? []) as {
    key: string;
    label: string;
    sort_order: number;
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
        }))
      : DEFAULT_CONFIG.groups;

  return { siteName, logoUrl, groups: builtGroups };
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
