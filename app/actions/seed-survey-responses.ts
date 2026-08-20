"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import {
  SEED_ADMIN_MAX_COUNT,
  seedSurveyResponses,
} from "@/lib/seed-survey-responses";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SeedSurveyResponsesState =
  | { error: string; ok?: undefined }
  | { ok: true; inserted: number; totalCount: number; error?: undefined };

export async function seedSurveyResponsesAction(
  slug: string,
  count: number,
): Promise<SeedSurveyResponsesState> {
  await requireAdminPanelAccess();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버에 Service Role 키가 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const result = await seedSurveyResponses(admin, slug, count, SEED_ADMIN_MAX_COUNT);

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/progress");
  revalidatePath("/admin/backups");
  revalidatePath("/surveys");
  revalidatePath(`/survey/${result.slug}`);

  return {
    ok: true,
    inserted: result.inserted,
    totalCount: result.totalCount,
  };
}
