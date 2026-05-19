"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import type { SiteBannerPlacement } from "@/lib/site-banners";
import { deleteSiteMediaFile, uploadSiteMediaFile } from "@/lib/site-media-upload";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SiteBannerActionState = {
  error?: string;
  ok?: boolean;
};

function revalidateBanners() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners");
}

function parsePlacement(raw: string): SiteBannerPlacement | null {
  return raw === "top" || raw === "popup" ? raw : null;
}

function normalizeLinkUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  return null;
}

export async function createSiteBannerAction(
  _prev: SiteBannerActionState,
  formData: FormData,
): Promise<SiteBannerActionState> {
  await requireSuperAdmin();

  const placement = parsePlacement(String(formData.get("placement") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  const linkUrl = normalizeLinkUrl(String(formData.get("link_url") ?? ""));
  const file = formData.get("file");

  if (!placement) {
    return { error: "배너 종류가 올바르지 않습니다." };
  }

  if (!(file instanceof File)) {
    return { error: "배너 이미지 또는 PDF 파일을 선택하세요." };
  }

  const uploaded = await uploadSiteMediaFile(file, `banners/${placement}`);
  if (!uploaded.ok) {
    return { error: uploaded.error };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: maxRow } = await admin
    .from("site_banners")
    .select("sort_order")
    .eq("placement", placement)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder =
    typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const { error } = await admin.from("site_banners").insert({
    title: title || safeNameFromFile(file.name),
    media_type: uploaded.data.mediaType,
    file_url: uploaded.data.url,
    link_url: linkUrl,
    is_active: true,
    sort_order: sortOrder,
    storage_path: uploaded.data.storagePath,
    placement,
  });

  if (error) {
    await deleteSiteMediaFile(uploaded.data.storagePath);
    if (error.message.includes("site_banners")) {
      return {
        error:
          "site_banners 테이블이 없습니다. supabase/migrations/20260407240000_site_banners.sql 및 20260407250000_site_banners_placement.sql 을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  revalidateBanners();
  return { ok: true };
}

function safeNameFromFile(name: string): string {
  return name.replace(/\.[^.]+$/, "").slice(0, 80) || "배너";
}

export async function toggleSiteBannerActiveAction(
  _prev: SiteBannerActionState,
  formData: FormData,
): Promise<SiteBannerActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) return { error: "배너 ID가 없습니다." };

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("site_banners")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateBanners();
  return { ok: true };
}

export async function deleteSiteBannerAction(
  _prev: SiteBannerActionState,
  formData: FormData,
): Promise<SiteBannerActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "배너 ID가 없습니다." };

  const admin = createSupabaseServiceRoleClient();
  const { data: row } = await admin
    .from("site_banners")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("site_banners").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await deleteSiteMediaFile(row?.storage_path as string | undefined);
  revalidateBanners();
  return { ok: true };
}

export async function moveSiteBannerOrderAction(
  _prev: SiteBannerActionState,
  formData: FormData,
): Promise<SiteBannerActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const placement = parsePlacement(String(formData.get("placement") ?? ""));
  const direction = String(formData.get("direction") ?? "");

  if (!id || !placement || (direction !== "up" && direction !== "down")) {
    return { error: "잘못된 요청입니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: rows, error: listError } = await admin
    .from("site_banners")
    .select("id, sort_order")
    .eq("placement", placement)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (listError || !rows?.length) {
    return { error: listError?.message ?? "배너를 찾을 수 없습니다." };
  }

  const index = rows.findIndex((r) => r.id === id);
  if (index < 0) return { error: "배너를 찾을 수 없습니다." };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= rows.length) {
    return { ok: true };
  }

  const current = rows[index];
  const other = rows[swapIndex];

  const { error: e1 } = await admin
    .from("site_banners")
    .update({ sort_order: other.sort_order, updated_at: new Date().toISOString() })
    .eq("id", current.id);

  const { error: e2 } = await admin
    .from("site_banners")
    .update({ sort_order: current.sort_order, updated_at: new Date().toISOString() })
    .eq("id", other.id);

  if (e1 || e2) {
    return { error: e1?.message ?? e2?.message ?? "순서 변경 실패" };
  }

  revalidateBanners();
  return { ok: true };
}
