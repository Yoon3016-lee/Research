import "server-only";

import type { SurveyStatus } from "@/lib/survey-list-types";
import { syncSurveyPeriodStatuses } from "@/lib/sync-survey-statuses";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SurveyScriptAdminRow = {
  slug: string;
  title: string;
  status: SurveyStatus;
  responseScript: string;
};

export async function listSurveyResponseScriptsForAdmin(): Promise<SurveyScriptAdminRow[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createSupabaseServiceRoleClient();
  await syncSurveyPeriodStatuses(admin);

  const { data, error } = await admin
    .from("surveys")
    .select("slug, title, status, response_script")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    if (error) {
      console.error("[listSurveyResponseScriptsForAdmin]", error.message);
    }
    return [];
  }

  return data.map((row) => ({
    slug: row.slug as string,
    title: row.title as string,
    status: row.status as SurveyStatus,
    responseScript: (row.response_script as string) ?? "",
  }));
}
