import "server-only";

import { resolveSurveyStatus, normalizeStoredDate } from "@/lib/survey-period";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = {
  id: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
};

/** 기간이 있는 설문의 status를 오늘 날짜 기준으로 DB에 맞춤 (RLS·목록 일치) */
export async function syncSurveyPeriodStatuses(
  admin: SupabaseClient,
): Promise<void> {
  const { data, error } = await admin
    .from("surveys")
    .select("id, period_start, period_end, status")
    .not("period_start", "is", null)
    .not("period_end", "is", null);

  if (error || !data?.length) return;

  const now = new Date().toISOString();

  for (const row of data as Row[]) {
    const start = normalizeStoredDate(row.period_start);
    const end = normalizeStoredDate(row.period_end);
    if (!start || !end) continue;

    const nextStatus = resolveSurveyStatus(start, end);
    if (nextStatus === row.status) continue;

    await admin
      .from("surveys")
      .update({ status: nextStatus, updated_at: now })
      .eq("id", row.id);
  }
}
