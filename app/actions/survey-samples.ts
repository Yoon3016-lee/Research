"use server";

import { revalidatePath } from "next/cache";
import { parseParticipationFormat } from "@/lib/survey-participation-format";
import { parseSurveySampleSpreadsheet } from "@/lib/survey-sample-parse";
import type {
  SurveySampleBatchPreviewResult,
  SurveySamplePreviewResult,
  SurveySampleUploadResult,
} from "@/lib/survey-sample-types";
import {
  activateSurveySampleBatch,
  getSurveySampleBatchPreview,
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

  const format = parseParticipationFormat(formData.get("participation_format"));

  const fileResult = await readFileFromFormData(formData);
  if ("error" in fileResult) {
    return { ok: false, error: fileResult.error };
  }

  try {
    const preview = parseSurveySampleSpreadsheet(fileResult.buffer, format);
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

  const format = parseParticipationFormat(formData.get("participation_format"));
  const uidColumn = String(formData.get("uid_column") ?? "").trim().toUpperCase();

  const fileResult = await readFileFromFormData(formData);
  if ("error" in fileResult) {
    return { ok: false, error: fileResult.error };
  }

  let mapping;
  if (format === "email") {
    const emailColumn = String(formData.get("email_column") ?? "").trim().toUpperCase();
    const nameColumn = String(formData.get("name_column") ?? "").trim().toUpperCase();
    if (!uidColumn || !emailColumn) {
      return { ok: false, error: "UID·이메일 열을 모두 선택하세요." };
    }
    mapping = {
      uidColumn,
      emailColumn,
      nameColumn: nameColumn || undefined,
    };
  } else {
    const phoneColumn = String(formData.get("phone_column") ?? "").trim().toUpperCase();
    const outcomeColumn = String(formData.get("outcome_column") ?? "").trim().toUpperCase();
    if (!uidColumn || !phoneColumn || !outcomeColumn) {
      return { ok: false, error: "UID·전화번호·결과 열을 모두 선택하세요." };
    }
    mapping = { uidColumn, phoneColumn, outcomeColumn };
  }

  const result = await uploadSurveySampleBatch({
    surveyRef: slug,
    uploadedBy: userId,
    originalFilename: fileResult.filename,
    mapping,
    fileBuffer: fileResult.buffer,
    participationFormat: format,
  });

  if (result.ok) {
    revalidatePath("/admin/surveys");
    revalidatePath("/admin/surveys/samples");
    revalidatePath("/admin/surveys/distribute");
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
    revalidatePath("/admin/surveys/distribute");
  }
  return result;
}

export async function previewSurveySampleBatchAction(
  slug: string,
  batchId: string,
): Promise<SurveySampleBatchPreviewResult> {
  await requireAdminPanelAccess();
  return getSurveySampleBatchPreview(slug, batchId);
}
