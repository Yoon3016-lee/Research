import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export const SITE_MEDIA_BUCKET = "site-page-assets";
export const SITE_MEDIA_MAX_BYTES = 10 * 1024 * 1024;

export const SITE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/** Supabase Storage object key — ASCII letters, digits, hyphen, underscore, dot only. */
export function safeMediaFileName(name: string): string {
  const trimmed = name.trim() || "file";
  const dot = trimmed.lastIndexOf(".");
  const rawExt = dot > 0 ? trimmed.slice(dot + 1) : "";
  const rawBase = dot > 0 ? trimmed.slice(0, dot) : trimmed;

  const ext = rawExt
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .slice(0, 10);

  const base =
    rawBase
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "")
      .slice(0, 80) || "file";

  return ext ? `${base}.${ext}` : base.slice(0, 120);
}

export type UploadedSiteMedia = {
  url: string;
  storagePath: string;
  mediaType: "image" | "pdf";
  mime: string;
};

export async function uploadSiteMediaFile(
  file: File,
  folder: string,
): Promise<{ ok: true; data: UploadedSiteMedia } | { ok: false; error: string }> {
  if (file.size === 0) {
    return { ok: false, error: "파일을 선택하세요." };
  }
  if (file.size > SITE_MEDIA_MAX_BYTES) {
    return { ok: false, error: "파일은 10MB 이하로 업로드할 수 있습니다." };
  }

  const mime = file.type || "application/octet-stream";
  const isImage = SITE_IMAGE_MIME_TYPES.has(mime);
  const isPdf = mime === "application/pdf";

  if (!isImage && !isPdf) {
    return {
      ok: false,
      error: "JPG, PNG, GIF, WEBP, PDF 파일만 업로드할 수 있습니다.",
    };
  }

  const safeFolder = folder.replace(/[^a-zA-Z0-9-_/]/g, "").replace(/\/+/g, "/");
  const objectPath = `${safeFolder}/${Date.now()}-${safeMediaFileName(file.name)}`;

  const admin = createSupabaseServiceRoleClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(objectPath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket")) {
      return {
        ok: false,
        error:
          "Storage 버킷이 없습니다. supabase/migrations/20260407230000_site_page_assets_storage.sql 을 실행하세요.",
      };
    }
    return { ok: false, error: uploadError.message };
  }

  const { data: publicData } = admin.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(objectPath);

  return {
    ok: true,
    data: {
      url: publicData.publicUrl,
      storagePath: objectPath,
      mediaType: isImage ? "image" : "pdf",
      mime,
    },
  };
}

export async function deleteSiteMediaFile(storagePath: string | null | undefined): Promise<void> {
  const path = storagePath?.trim();
  if (!path) return;

  const admin = createSupabaseServiceRoleClient();
  await admin.storage.from(SITE_MEDIA_BUCKET).remove([path]);
}
