"use server";

import { revalidatePath } from "next/cache";
import { saveGlobalCatiContactOptions } from "@/lib/cati-contact-options";
import type {
  CatiContactOptionInput,
  SaveCatiContactOptionsResult,
} from "@/lib/cati-contact-types";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export async function saveGlobalCatiContactOptionsAction(
  options: CatiContactOptionInput[],
): Promise<SaveCatiContactOptionsResult> {
  await requireAdminPanelAccess();

  const result = await saveGlobalCatiContactOptions(options);
  if (result.ok) {
    revalidatePath("/admin/surveys/contact-defaults");
  }
  return result;
}
