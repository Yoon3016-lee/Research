"use server";

import { revalidatePath } from "next/cache";
import { parseSurveySampleSpreadsheet } from "@/lib/survey-sample-parse";
import type {
  SurveySamplePreviewResult,
  SurveySampleUploadResult,
} from "@/lib/survey-sample-types";
import {
  activateSurveySampleBatch,
  uploadSurveySampleBatch,
} from "@/lib/survey-samples-admin";
import { requireAdminPanelAccess } from "@/lib/require-admin";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

async function readFileFromFormData(
  formData: FormData,
): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "엑셀 파일을 선택하세요." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "파일 크기는 15MB 이하여야 합니다." };
  }
  return { buffer: Buffer.from(await file.arrayBuffer()), filename: file.name };
}

export async function previewSurveySampleUploadAction(
  formData: FormData,
): Promise<SurveySamplePreviewResult> {
  await requireAdminPanelAccess();

  const fileResult = await readFileFromFormData(formData);
  if ("error" in fileResult) {
    return { ok: false, error: fileResult.error };
  }

  try {
    const preview = parseSurveySampleSpreadsheet(fileResult.buffer);
    return { ok: true, preview };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "엑셀 미리보기에 실패했습니다.",
    };
  }
}

export async function uploadSurveySampleBatchAction(
  formData: FormData,
): Promise<SurveySampleUploadResult> {
  const { userId } = await requireAdminPanelAccess();

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) {
    return { ok: false, error: "설문 slug가 없습니다." };
  }

  const uidColumn = String(formData.get("uid_column") ?? "").trim().toUpperCase();
  const phoneColumn = String(formData.get("phone_column") ?? "").trim().toUpperCase();
  const outcomeColumn = String(formData.get("outcome_column") ?? "").trim().toUpperCase();

  if (!uidColumn || !phoneColumn || !outcomeColumn) {
    return { ok: false, error: "UID·전화번호·결과 열을 모두 선택하세요." };
  }

  const fileResult = await readFileFromFormData(formData);
  if ("error" in fileResult) {
    return { ok: false, error: fileResult.error };
  }

  const result = await uploadSurveySampleBatch({
    surveyRef: slug,
    uploadedBy: userId,
    originalFilename: fileResult.filename,
    mapping: { uidColumn, phoneColumn, outcomeColumn },
    fileBuffer: fileResult.buffer,
  });

  if (result.ok) {
    revalidatePath("/admin/surveys");
    revalidatePath("/admin/surveys/samples");
  }

  return result;
}

export async function activateSurveySampleBatchAction(
  slug: string,
  batchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminPanelAccess();

  const result = await activateSurveySampleBatch(slug, batchId);
  if (result.ok) {
    revalidatePath("/admin/surveys/samples");
  }
  return result;
}
