"use server";

import { requireAdminPanelAccess } from "@/lib/require-admin";
import {
  deleteSurveyQuestionMedia,
  uploadSurveyQuestionMedia,
} from "@/lib/survey-media-upload";

export type SurveyMediaUploadState =
  | { ok: true; url: string; storagePath: string; mediaType: "image" | "video" }
  | { ok: false; error: string };

export async function uploadSurveyQuestionMediaAction(
  formData: FormData,
): Promise<SurveyMediaUploadState> {
  await requireAdminPanelAccess();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "파일을 선택하세요." };
  }

  const uploaded = await uploadSurveyQuestionMedia(file);
  if (!uploaded.ok) return { ok: false, error: uploaded.error };

  return {
    ok: true,
    url: uploaded.data.url,
    storagePath: uploaded.data.storagePath,
    mediaType: uploaded.data.mediaType,
  };
}

export async function removeSurveyQuestionMediaAction(
  storagePath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminPanelAccess();
  await deleteSurveyQuestionMedia(storagePath);
  return { ok: true };
}
