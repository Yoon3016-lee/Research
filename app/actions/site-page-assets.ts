"use server";

import { requireSuperAdmin } from "@/lib/require-super-admin";
import { buildImageEmbed, buildPdfEmbed } from "@/lib/site-page-body";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

const BUCKET = "site-page-assets";
const MAX_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export type SitePageAssetUploadState = {
  error?: string;
  snippet?: string;
  url?: string;
};

function safeFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "file";
  return base.slice(0, 120);
}

function storageFolder(pageId: string, draftKey: string): string {
  const id = pageId.trim() || `draft-${draftKey.trim() || "misc"}`;
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

export async function uploadSitePageAssetAction(
  _prev: SitePageAssetUploadState,
  formData: FormData,
): Promise<SitePageAssetUploadState> {
  await requireSuperAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "\ud30c\uc77c\uc744 \uc120\ud0dd\ud558\uc138\uc694." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "\ud30c\uc77c\uc740 10MB \uc774\ud558\ub85c \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4." };
  }

  const mime = file.type || "application/octet-stream";
  const isImage = IMAGE_TYPES.has(mime);
  const isPdf = mime === "application/pdf";

  if (!isImage && !isPdf) {
    return {
      error: "JPG, PNG, GIF, WEBP, PDF \ud30c\uc77c\ub9cc \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
    };
  }

  const pageId = String(formData.get("page_id") ?? "");
  const draftKey = String(formData.get("draft_key") ?? "");
  const folder = storageFolder(pageId, draftKey);
  const objectPath = `${folder}/${Date.now()}-${safeFileName(file.name)}`;

  const admin = createSupabaseServiceRoleClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: mime,
    upsert: false,
  });

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket")) {
      return {
        error:
          "Storage \ubc84\ud0b7\uc774 \uc5c6\uc2b5\ub2c8\ub2e4. supabase/migrations/20260407230000_site_page_assets_storage.sql \uc744 \uc2e4\ud589\ud558\uc138\uc694.",
      };
    }
    return { error: uploadError.message };
  }

  const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
  const url = publicData.publicUrl;
  const label = safeFileName(file.name);

  const snippet = isImage ? buildImageEmbed(url, label) : buildPdfEmbed(url, label);

  return { url, snippet };
}
