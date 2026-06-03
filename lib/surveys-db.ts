import "server-only";

import type { AdminSurveyRow, OngoingSurvey, SurveyStatus } from "@/lib/survey-list-types";
import { syncSurveyPeriodStatuses } from "@/lib/sync-survey-statuses";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SurveyRow = {
  slug: string;
  title: string;
  summary: string;
  period_label: string;
  response_count: number;
  target_count: number;
  status: string;
  updated_at: string;
};

function toDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function mapToOngoing(row: SurveyRow): OngoingSurvey {
  return {
    id: row.slug,
    title: row.title,
    summary: row.summary,
    periodLabel: row.period_label,
    responseCount: row.response_count,
    targetCount: row.target_count,
    status: row.status as SurveyStatus,
  };
}

function mapToAdmin(row: SurveyRow): AdminSurveyRow {
  return {
    id: row.slug,
    title: row.title,
    updatedAt: toDateLabel(row.updated_at),
    status: row.status as SurveyStatus,
    responses: row.response_count,
    targetCount: row.target_count,
  };
}

const PUBLIC_LIST_STATUSES: SurveyStatus[] = ["진행중", "예정"];

const STATUS_SORT: Record<SurveyStatus, number> = {
  진행중: 0,
  예정: 1,
  종료: 2,
};

function sortPublicSurveys(rows: SurveyRow[]): OngoingSurvey[] {
  return [...rows]
    .sort((a, b) => {
      const byStatus =
        STATUS_SORT[a.status as SurveyStatus] - STATUS_SORT[b.status as SurveyStatus];
      if (byStatus !== 0) return byStatus;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .map(mapToOngoing);
}

/** 공개 `/surveys` — 노출 설정된 진행중·예정 설문 (참여는 진행중만) */
export async function getPublicOngoingSurveys(): Promise<OngoingSurvey[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }
  try {
    const select =
      "slug, title, summary, period_label, response_count, target_count, status, updated_at";

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createSupabaseServiceRoleClient();
      await syncSurveyPeriodStatuses(admin);
      const { data, error } = await admin
        .from("surveys")
        .select(select)
        .eq("listed_public", true)
        .in("status", PUBLIC_LIST_STATUSES)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!data?.length) return [];
      return sortPublicSurveys(data as SurveyRow[]);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("surveys")
      .select(select)
      .eq("listed_public", true)
      .in("status", PUBLIC_LIST_STATUSES)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];
    return sortPublicSurveys(data as SurveyRow[]);
  } catch (err) {
    console.error("[getPublicOngoingSurveys]", err);
    return [];
  }
}

/** 관리자 설문 목록 — service role (전체 행) */
export async function getAdminSurveys(): Promise<AdminSurveyRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return [];
  }
  try {
    const supabase = createSupabaseServiceRoleClient();
    await syncSurveyPeriodStatuses(supabase);

    const { data, error } = await supabase
      .from("surveys")
      .select(
        "slug, title, summary, period_label, response_count, target_count, status, updated_at",
      )
      .order("updated_at", { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];
    return (data as SurveyRow[]).map(mapToAdmin);
  } catch (err) {
    console.error("[getAdminSurveys]", err);
    return [];
  }
}
