import "server-only";

import { safeMediaFileName } from "@/lib/site-media-upload";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export const SURVEY_MEDIA_BUCKET = "survey-question-media";
export const SURVEY_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const SURVEY_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type SurveyQuestionMediaType = "image" | "video";

export type UploadedSurveyMedia = {
  url: string;
  storagePath: string;
  mediaType: SurveyQuestionMediaType;
  mime: string;
};

export async function uploadSurveyQuestionMedia(
  file: File,
): Promise<{ ok: true; data: UploadedSurveyMedia } | { ok: false; error: string }> {
  if (file.size === 0) {
    return { ok: false, error: "파일을 선택하세요." };
  }

  const mime = file.type || "application/octet-stream";
  const isImage = IMAGE_MIME.has(mime);
  const isVideo = VIDEO_MIME.has(mime);

  if (!isImage && !isVideo) {
    return {
      ok: false,
      error: "JPG, PNG, GIF, WEBP 이미지 또는 MP4, WEBM, MOV 영상만 업로드할 수 있습니다.",
    };
  }

  const maxBytes = isVideo ? SURVEY_VIDEO_MAX_BYTES : SURVEY_IMAGE_MAX_BYTES;
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: isVideo
        ? "영상은 50MB 이하로 업로드할 수 있습니다."
        : "이미지는 10MB 이하로 업로드할 수 있습니다.",
    };
  }

  const objectPath = `questions/${Date.now()}-${safeMediaFileName(file.name)}`;
  const admin = createSupabaseServiceRoleClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(SURVEY_MEDIA_BUCKET)
    .upload(objectPath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket")) {
      return {
        ok: false,
        error:
          "Storage 버킷이 없습니다. supabase/migrations/20260408610000_survey_question_media_storage.sql 을 실행하세요.",
      };
    }
    return { ok: false, error: uploadError.message };
  }

  const { data: publicData } = admin.storage
    .from(SURVEY_MEDIA_BUCKET)
    .getPublicUrl(objectPath);

  return {
    ok: true,
    data: {
      url: publicData.publicUrl,
      storagePath: objectPath,
      mediaType: isImage ? "image" : "video",
      mime,
    },
  };
}

export async function deleteSurveyQuestionMedia(
  storagePath: string | null | undefined,
): Promise<void> {
  const path = storagePath?.trim();
  if (!path) return;
  const admin = createSupabaseServiceRoleClient();
  await admin.storage.from(SURVEY_MEDIA_BUCKET).remove([path]);
}
