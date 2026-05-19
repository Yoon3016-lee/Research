import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SiteBannerMediaType = "image" | "pdf";

export type SiteBanner = {
  id: string;
  title: string;
  mediaType: SiteBannerMediaType;
  fileUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  storagePath: string | null;
};

function mapRow(row: {
  id: string;
  title: string;
  media_type: string;
  file_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  storage_path: string | null;
}): SiteBanner {
  return {
    id: row.id,
    title: row.title,
    mediaType: row.media_type as SiteBannerMediaType,
    fileUrl: row.file_url,
    linkUrl: row.link_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
  };
}

export async function listActiveSiteBanners(): Promise<SiteBanner[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_banners")
    .select(
      "id, title, media_type, file_url, link_url, is_active, sort_order, storage_path",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("[listActiveSiteBanners]", error.message);
    }
    return [];
  }

  return data.map((row) =>
    mapRow(
      row as {
        id: string;
        title: string;
        media_type: string;
        file_url: string;
        link_url: string | null;
        is_active: boolean;
        sort_order: number;
        storage_path: string | null;
      },
    ),
  );
}

export async function listAllSiteBanners(): Promise<SiteBanner[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_banners")
    .select(
      "id, title, media_type, file_url, link_url, is_active, sort_order, storage_path",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("[listAllSiteBanners]", error.message);
    }
    return [];
  }

  return data.map((row) =>
    mapRow(
      row as {
        id: string;
        title: string;
        media_type: string;
        file_url: string;
        link_url: string | null;
        is_active: boolean;
        sort_order: number;
        storage_path: string | null;
      },
    ),
  );
}
