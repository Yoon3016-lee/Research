import "server-only";

import type { AdminSurveyRow, OngoingSurvey, SurveyStatus } from "@/lib/survey-list-types";
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

/** 공개 `/surveys` — anon + RLS(진행중·노출만) */
export async function getPublicOngoingSurveys(): Promise<OngoingSurvey[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("surveys")
      .select(
        "slug, title, summary, period_label, response_count, target_count, status, updated_at",
      )
      .eq("status", "진행중")
      .eq("listed_public", true)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];
    return (data as SurveyRow[]).map(mapToOngoing);
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
