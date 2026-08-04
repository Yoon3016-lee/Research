"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { parseSiteNameFontKey } from "@/lib/site-name-fonts";
import { deleteSiteMediaFile, uploadSiteMediaFile } from "@/lib/site-media-upload";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SiteHomepageActionState = {
  error?: string;
  ok?: boolean;
  siteName?: string;
  siteNameFont?: string;
};

function revalidateSite() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/nav");
}

function normalizeGroupKey(raw: string): string | null {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!key || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) return null;
  if (key.length > 64) return null;
  return key;
}

async function parseGroupKey(raw: string): Promise<string | null> {
  const key = normalizeGroupKey(raw);
  if (!key) return null;

  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin
    .from("site_nav_groups")
    .select("key")
    .eq("key", key)
    .maybeSingle();

  return data?.key ?? null;
}

function normalizeHref(raw: string): string | null {
  const href = raw.trim();
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  return href;
}

function normalizePageSlug(raw: string): string | null {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

async function allocateUniquePageSlug(
  admin: ReturnType<typeof createSupabaseServiceRoleClient>,
  base: string,
): Promise<string> {
  for (let n = 0; n < 50; n++) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await admin
      .from("site_pages")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function isUniqueSlugViolation(message: string): boolean {
  return (
    message.includes("site_pages_slug_key") ||
    message.includes("duplicate key") ||
    message.includes("unique constraint")
  );
}

/** /p/영문주소 형식 href에서 site_pages.slug 추출 */
function extractPageSlugFromHref(href: string): string | null {
  const path = (href.split("?")[0]?.split("#")[0] ?? href).replace(/\/+$/, "");
  if (!path.toLowerCase().startsWith("/p/")) return null;
  const raw = path.slice(3);
  if (!raw) return null;
  return normalizePageSlug(raw);
}

export async function updateSiteNameAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const siteName = String(formData.get("site_name") ?? "").trim();
  const siteNameFont = parseSiteNameFontKey(formData.get("site_name_font"));
  if (!siteName) {
    return { error: "홈페이지 이름을 입력하세요." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("site_settings")
    .update({
      site_name: siteName,
      site_name_font: siteNameFont,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    if (error.message.includes("site_name_font")) {
      return {
        error:
          "site_name_font 컬럼이 없습니다. supabase/migrations/20260407600000_site_settings_name_font.sql 을 실행하세요.",
      };
    }
    if (error.message.includes("site_settings")) {
      return {
        error:
          "site_settings 테이블이 없습니다. supabase/migrations/20260407220000_site_homepage_cms.sql 을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  revalidateSite();
  return { ok: true, siteName, siteNameFont };
}

export async function updateSiteLogoAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "로고 이미지 파일을 선택하세요." };
  }

  const uploaded = await uploadSiteMediaFile(file, "site-logo");
  if (!uploaded.ok) {
    return { error: uploaded.error };
  }
  if (uploaded.data.mediaType !== "image") {
    await deleteSiteMediaFile(uploaded.data.storagePath);
    return { error: "로고는 JPG, PNG, GIF, WEBP 이미지만 사용할 수 있습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: current, error: readError } = await admin
    .from("site_settings")
    .select("logo_storage_path")
    .eq("id", 1)
    .maybeSingle();

  if (readError) {
    await deleteSiteMediaFile(uploaded.data.storagePath);
    return { error: readError.message };
  }

  const { error } = await admin
    .from("site_settings")
    .update({
      logo_url: uploaded.data.url,
      logo_storage_path: uploaded.data.storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    await deleteSiteMediaFile(uploaded.data.storagePath);
    if (error.message.includes("logo_url") || error.message.includes("site_settings")) {
      return {
        error:
          "logo_url 컬럼이 없습니다. supabase/migrations/20260407290000_site_settings_logo.sql 을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  await deleteSiteMediaFile(current?.logo_storage_path as string | undefined);

  revalidateSite();
  return { ok: true };
}

export async function deleteSiteLogoAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  void formData;
  await requireSuperAdmin();

  const admin = createSupabaseServiceRoleClient();
  const { data: current, error: readError } = await admin
    .from("site_settings")
    .select("logo_storage_path")
    .eq("id", 1)
    .maybeSingle();

  if (readError) {
    return { error: readError.message };
  }

  const { error } = await admin
    .from("site_settings")
    .update({
      logo_url: null,
      logo_storage_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    if (error.message.includes("logo_url") || error.message.includes("site_settings")) {
      return {
        error:
          "logo_url 컬럼이 없습니다. supabase/migrations/20260407290000_site_settings_logo.sql 을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  await deleteSiteMediaFile(current?.logo_storage_path as string | undefined);

  revalidateSite();
  return { ok: true };
}

export async function createNavItemAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const groupKey = await parseGroupKey(String(formData.get("group_key") ?? ""));
  const label = String(formData.get("label") ?? "").trim();
  const hrefInput = String(formData.get("href") ?? "").trim();
  const createPage = String(formData.get("create_page") ?? "") === "on";
  const pageTitle = String(formData.get("page_title") ?? "").trim();
  const pageSlugRaw = String(formData.get("page_slug") ?? "").trim();
  const pageBody = String(formData.get("page_body") ?? "").trim();

  if (!groupKey) return { error: "메뉴 그룹이 올바르지 않습니다." };
  if (!label) return { error: "하위 메뉴 이름을 입력하세요." };

  const admin = createSupabaseServiceRoleClient();
  let href = normalizeHref(hrefInput);
  let pageId: string | null = null;

  if (createPage) {
    const explicitSlug = Boolean(pageSlugRaw.trim());
    const baseSlug = normalizePageSlug(pageSlugRaw || label);
    const title = pageTitle || label;
    if (!baseSlug) {
      return {
        error:
          "페이지 주소는 영문 소문자·숫자·하이픈만 사용할 수 있습니다. 예: service-guide (한글 메뉴 이름만으로는 주소를 만들 수 없습니다.)",
      };
    }

    let slug = baseSlug;
    if (explicitSlug) {
      const { data: existing } = await admin
        .from("site_pages")
        .select("id, slug")
        .eq("slug", baseSlug)
        .maybeSingle();
      if (existing) {
        return {
          error: `페이지 주소 「${baseSlug}」는 이미 사용 중입니다. 다른 영문 주소를 입력하거나, 연결 방식에서 「기존 경로로 연결」을 선택한 뒤 /p/${baseSlug} 를 입력하세요.`,
        };
      }
    } else {
      slug = await allocateUniquePageSlug(admin, baseSlug);
    }

    const { data: page, error: pageError } = await admin
      .from("site_pages")
      .insert({ slug, title, body: pageBody })
      .select("id, slug")
      .single();

    if (pageError) {
      if (isUniqueSlugViolation(pageError.message)) {
        return {
          error: `페이지 주소 「${slug}」는 이미 사용 중입니다. 다른 영문 주소를 입력하세요.`,
        };
      }
      return { error: pageError.message };
    }
    pageId = page.id as string;
    href = `/p/${page.slug}`;
  } else {
    if (!href) {
      return {
        error:
          "링크 경로를 입력하세요. (예: /surveys) 새 글 페이지를 만들려면 연결 방식에서 「새 콘텐츠 페이지 만들기」를 선택하세요.",
      };
    }
  }

  const { data: maxRow } = await admin
    .from("site_nav_items")
    .select("sort_order")
    .eq("group_key", groupKey)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder =
    typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const { error } = await admin.from("site_nav_items").insert({
    group_key: groupKey,
    label,
    href,
    sort_order: sortOrder,
    page_id: pageId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateSite();
  revalidatePath(`/p/${href.replace(/^\/p\//, "")}`);
  return { ok: true };
}

export async function updateNavItemAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const href = normalizeHref(String(formData.get("href") ?? ""));

  if (!id) return { error: "메뉴 ID가 없습니다." };
  if (!label) return { error: "하위 메뉴 이름을 입력하세요." };
  if (!href) return { error: "링크는 / 로 시작해야 합니다." };

  const admin = createSupabaseServiceRoleClient();

  const { data: existing, error: findError } = await admin
    .from("site_nav_items")
    .select("id, page_id")
    .eq("id", id)
    .maybeSingle();

  if (findError) return { error: findError.message };
  if (!existing) return { error: "메뉴를 찾을 수 없습니다." };

  let finalHref = href;
  let oldSlug: string | null = null;
  let newSlug: string | null = null;

  const pageId = existing.page_id as string | null;
  if (pageId) {
    const slugFromHref = extractPageSlugFromHref(href);
    if (slugFromHref) {
      const { data: pageRow, error: pageLoadError } = await admin
        .from("site_pages")
        .select("slug")
        .eq("id", pageId)
        .maybeSingle();

      if (pageLoadError) return { error: pageLoadError.message };
      if (pageRow) {
        oldSlug = pageRow.slug as string;
        if (slugFromHref !== oldSlug) {
          const { data: conflict } = await admin
            .from("site_pages")
            .select("id")
            .eq("slug", slugFromHref)
            .neq("id", pageId)
            .maybeSingle();

          if (conflict) {
            return {
              error: `페이지 주소 「${slugFromHref}」는 이미 사용 중입니다. 다른 경로를 입력하세요.`,
            };
          }

          const { error: slugError } = await admin
            .from("site_pages")
            .update({
              slug: slugFromHref,
              updated_at: new Date().toISOString(),
            })
            .eq("id", pageId);

          if (slugError) {
            if (isUniqueSlugViolation(slugError.message)) {
              return {
                error: `페이지 주소 「${slugFromHref}」는 이미 사용 중입니다. 다른 경로를 입력하세요.`,
              };
            }
            return { error: slugError.message };
          }

          newSlug = slugFromHref;
          finalHref = `/p/${slugFromHref}`;
        }
      }
    } else if (href.toLowerCase().startsWith("/p/")) {
      return {
        error:
          "CMS 페이지 링크는 /p/영문주소 형식이어야 합니다. (영문 소문자·숫자·하이픈)",
      };
    }
  }

  const { error } = await admin
    .from("site_nav_items")
    .update({
      label,
      href: finalHref,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (newSlug && pageId) {
    await admin
      .from("site_nav_items")
      .update({
        href: finalHref,
        updated_at: new Date().toISOString(),
      })
      .eq("page_id", pageId)
      .neq("id", id);
  }

  revalidateSite();
  if (oldSlug) revalidatePath(`/p/${oldSlug}`);
  if (newSlug) revalidatePath(`/p/${newSlug}`);
  else {
    const slug = extractPageSlugFromHref(finalHref);
    if (slug) revalidatePath(`/p/${slug}`);
  }

  return { ok: true };
}

export async function updateNavItemPageAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const pageId = String(formData.get("page_id") ?? "").trim();
  const title = String(formData.get("page_title") ?? "").trim();
  const body = String(formData.get("page_body") ?? "");

  if (!pageId) return { error: "페이지 ID가 없습니다." };
  if (!title) return { error: "페이지 제목을 입력하세요." };

  const admin = createSupabaseServiceRoleClient();
  const { data: page, error } = await admin
    .from("site_pages")
    .update({
      title,
      body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId)
    .select("slug")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidateSite();
  if (page?.slug) {
    revalidatePath(`/p/${page.slug as string}`);
  }
  return { ok: true };
}

export async function deleteNavItemAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "메뉴 ID가 없습니다." };

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin.from("site_nav_items").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidateSite();
  return { ok: true };
}

export async function createNavGroupAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const label = String(formData.get("label") ?? "").trim();
  const keyInput = String(formData.get("key") ?? "").trim();
  const key = normalizeGroupKey(keyInput || label);

  if (!label) return { error: "탭 이름을 입력하세요." };
  if (!key) {
    return {
      error:
        "탭 ID는 영문 소문자·숫자·하이픈만 사용할 수 있습니다. (예: company, news)",
    };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: existing } = await admin
    .from("site_nav_groups")
    .select("key")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    return { error: "이미 사용 중인 탭 ID입니다. 다른 ID를 입력하세요." };
  }

  const { data: maxRow } = await admin
    .from("site_nav_groups")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder =
    typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0;

  const guideFile = formData.get("guide_pdf");
  let guidePdfUrl: string | null = null;
  let guidePdfPath: string | null = null;
  let guideMediaType: "image" | "pdf" | null = null;
  if (guideFile instanceof File && guideFile.size > 0) {
    const uploaded = await uploadSiteMediaFile(guideFile, "nav-guides");
    if (!uploaded.ok) return { error: uploaded.error };
    guidePdfUrl = uploaded.data.url;
    guidePdfPath = uploaded.data.storagePath;
    guideMediaType = uploaded.data.mediaType;
  }

  const { error } = await admin.from("site_nav_groups").insert({
    key,
    label,
    sort_order: sortOrder,
    guide_pdf_url: guidePdfUrl,
    guide_pdf_path: guidePdfPath,
    guide_media_type: guideMediaType,
  });

  if (error) {
    await deleteSiteMediaFile(guidePdfPath);
    if (error.message.includes("site_nav_groups")) {
      return {
        error:
          "site_nav_groups 테이블이 없습니다. supabase/migrations/20260407220000_site_homepage_cms.sql 을 실행하세요.",
      };
    }
    return { error: error.message };
  }

  revalidateSite();
  return { ok: true };
}

export async function updateNavGroupAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const key = normalizeGroupKey(String(formData.get("key") ?? ""));
  const label = String(formData.get("label") ?? "").trim();
  const removeGuide = String(formData.get("remove_guide_pdf") ?? "") === "on";
  const guideFile = formData.get("guide_pdf");

  if (!key) return { error: "탭 ID가 올바르지 않습니다." };
  if (!label) return { error: "탭 이름을 입력하세요." };

  const admin = createSupabaseServiceRoleClient();

  const { data: existing } = await admin
    .from("site_nav_groups")
    .select("guide_pdf_path")
    .eq("key", key)
    .maybeSingle();
  const currentGuidePath = (existing?.guide_pdf_path as string | null) ?? null;

  const update: Record<string, unknown> = { label };
  let pathToDelete: string | null = null;

  if (guideFile instanceof File && guideFile.size > 0) {
    const uploaded = await uploadSiteMediaFile(guideFile, "nav-guides");
    if (!uploaded.ok) return { error: uploaded.error };
    update.guide_pdf_url = uploaded.data.url;
    update.guide_pdf_path = uploaded.data.storagePath;
    update.guide_media_type = uploaded.data.mediaType;
    pathToDelete = currentGuidePath;
  } else if (removeGuide) {
    update.guide_pdf_url = null;
    update.guide_pdf_path = null;
    update.guide_media_type = null;
    pathToDelete = currentGuidePath;
  }

  const { data, error } = await admin
    .from("site_nav_groups")
    .update(update)
    .eq("key", key)
    .select("key")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "해당 탭을 찾을 수 없습니다." };
  }

  await deleteSiteMediaFile(pathToDelete);

  revalidateSite();
  return { ok: true };
}

export async function deleteNavGroupAction(
  _prev: SiteHomepageActionState,
  formData: FormData,
): Promise<SiteHomepageActionState> {
  await requireSuperAdmin();

  const key = normalizeGroupKey(String(formData.get("key") ?? ""));
  if (!key) return { error: "탭 ID가 올바르지 않습니다." };

  const admin = createSupabaseServiceRoleClient();
  const { data: existing } = await admin
    .from("site_nav_groups")
    .select("guide_pdf_path")
    .eq("key", key)
    .maybeSingle();

  const { error } = await admin.from("site_nav_groups").delete().eq("key", key);

  if (error) {
    return { error: error.message };
  }

  await deleteSiteMediaFile((existing?.guide_pdf_path as string | null) ?? null);

  revalidateSite();
  return { ok: true };
}
