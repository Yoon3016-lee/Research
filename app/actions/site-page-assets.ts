"use server";

import { requireSuperAdmin } from "@/lib/require-super-admin";
import { buildImageEmbed, buildPdfEmbed } from "@/lib/site-page-body";
import { uploadSiteMediaFile } from "@/lib/site-media-upload";

export type SitePageAssetUploadState = {
  error?: string;
  snippet?: string;
  url?: string;
};

function storageFolder(pageId: string, draftKey: string): string {
  const id = pageId.trim() || `draft-${draftKey.trim() || "misc"}`;
  return `pages/${id.replace(/[^a-zA-Z0-9-_]/g, "")}`;
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

  const pageId = String(formData.get("page_id") ?? "");
  const draftKey = String(formData.get("draft_key") ?? "");
  const folder = storageFolder(pageId, draftKey);

  const uploaded = await uploadSiteMediaFile(file, folder);
  if (!uploaded.ok) {
    return { error: uploaded.error };
  }

  const label = file.name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "file";
  const snippet =
    uploaded.data.mediaType === "image"
      ? buildImageEmbed(uploaded.data.url, label)
      : buildPdfEmbed(uploaded.data.url, label);

  return { url: uploaded.data.url, snippet };
}
