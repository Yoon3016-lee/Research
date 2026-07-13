"use server";

import { revalidatePath } from "next/cache";
import { saveCatiContactOptions } from "@/lib/cati-contact-options";
import type {
  CatiContactOptionInput,
  SaveCatiContactOptionsResult,
} from "@/lib/cati-contact-types";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export async function saveCatiContactOptionsAction(
  slug: string,
  options: CatiContactOptionInput[],
): Promise<SaveCatiContactOptionsResult> {
  await requireAdminPanelAccess();

  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    return { ok: false, error: "설문 slug가 없습니다." };
  }

  const result = await saveCatiContactOptions(trimmedSlug, options);
  if (result.ok) {
    revalidatePath("/admin/surveys/contact");
    revalidatePath(`/survey/${trimmedSlug}`);
  }
  return result;
}
