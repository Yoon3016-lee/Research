import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SiteBannerMediaType = "image" | "pdf";
export type SiteBannerPlacement = "popup" | "top";

export type SiteBanner = {
  id: string;
  title: string;
  mediaType: SiteBannerMediaType;
  fileUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  storagePath: string | null;
  placement: SiteBannerPlacement;
};

type BannerRow = {
  id: string;
  title: string;
  media_type: string;
  file_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  storage_path: string | null;
  placement: string;
};

function mapRow(row: BannerRow): SiteBanner {
  const placement =
    row.placement === "top" ? "top" : ("popup" satisfies SiteBannerPlacement);
  return {
    id: row.id,
    title: row.title,
    mediaType: row.media_type as SiteBannerMediaType,
    fileUrl: row.file_url,
    linkUrl: row.link_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
    placement,
  };
}

const SELECT_COLS =
  "id, title, media_type, file_url, link_url, is_active, sort_order, storage_path, placement";

export async function listActiveSiteBanners(
  placement: SiteBannerPlacement,
): Promise<SiteBanner[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_banners")
    .select(SELECT_COLS)
    .eq("placement", placement)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("[listActiveSiteBanners]", placement, error.message);
    }
    return [];
  }

  return data.map((row) => mapRow(row as BannerRow));
}

export async function listAllSiteBanners(
  placement: SiteBannerPlacement,
): Promise<SiteBanner[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_banners")
    .select(SELECT_COLS)
    .eq("placement", placement)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("[listAllSiteBanners]", placement, error.message);
    }
    return [];
  }

  return data.map((row) => mapRow(row as BannerRow));
}
