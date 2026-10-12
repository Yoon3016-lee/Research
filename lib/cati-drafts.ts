import "server-only";

import type { CatiDraft } from "@/lib/cati-sample-types";
import type { SurveyAnswerInput } from "@/lib/survey-public";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

type DraftRow = {
  answers: SurveyAnswerInput[] | null;
  active_question_id: string | null;
  updated_at: string;
  started_at?: string | null;
  active_seconds?: number | null;
};

function omit<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Omit<T, K> {
  const next = { ...source };
  for (const key of keys) {
    delete (next as Partial<T>)[key];
  }
  return next;
}

function mapDraftRow(row: DraftRow): CatiDraft {
  return {
    answers: Array.isArray(row.answers) ? row.answers : [],
    activeQuestionId: row.active_question_id,
    updatedAt: row.updated_at,
    startedAt: row.started_at ?? null,
    activeSeconds:
      typeof row.active_seconds === "number" && row.active_seconds >= 0
        ? row.active_seconds
        : 0,
  };
}

async function resolveSurveyId(ref: string): Promise<string | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  let query = admin.from("surveys").select("id");
  query = isUuid(normalized) ? query.eq("id", normalized) : query.eq("slug", normalized);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function getCatiDraft(sampleId: string): Promise<CatiDraft | null> {
  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("survey_response_drafts")
    .select("answers, active_question_id, updated_at, started_at, active_seconds")
    .eq("sample_id", sampleId)
    .maybeSingle();

  if (error?.message?.includes("active_seconds") || error?.message?.includes("started_at")) {
    const fallback = await admin
      .from("survey_response_drafts")
      .select("answers, active_question_id, updated_at, started_at")
      .eq("sample_id", sampleId)
      .maybeSingle();
    if (fallback.error?.message?.includes("started_at")) {
      const basic = await admin
        .from("survey_response_drafts")
        .select("answers, active_question_id, updated_at")
        .eq("sample_id", sampleId)
        .maybeSingle();
      if (basic.error || !basic.data) return null;
      return mapDraftRow(basic.data as DraftRow);
    }
    if (fallback.error || !fallback.data) return null;
    return mapDraftRow(fallback.data as DraftRow);
  }

  if (error || !data) return null;
  return mapDraftRow(data as DraftRow);
}

export async function saveCatiDraft(params: {
  surveyRef: string;
  sampleId: string;
  answers: SurveyAnswerInput[];
  activeQuestionId: string | null;
  updatedBy: string;
  startedAt?: string | null;
  activeSeconds?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const surveyId = await resolveSurveyId(params.surveyRef);
  if (!surveyId) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: sample } = await admin
    .from("survey_samples")
    .select("id")
    .eq("id", params.sampleId)
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (!sample) {
    return { ok: false, error: "표본을 찾을 수 없습니다." };
  }

  const existing = await getCatiDraft(params.sampleId);
  const startedCandidates = [params.startedAt, existing?.startedAt].filter(
    (v): v is string => Boolean(v?.trim()),
  );
  const startedAt =
    startedCandidates
      .map((v) => ({ v, t: new Date(v).getTime() }))
      .filter((x) => !Number.isNaN(x.t))
      .sort((a, b) => a.t - b.t)[0]?.v ?? params.startedAt ?? null;
  const incomingSeconds =
    typeof params.activeSeconds === "number" && Number.isFinite(params.activeSeconds)
      ? Math.max(0, Math.round(params.activeSeconds))
      : 0;
  const activeSeconds = Math.max(incomingSeconds, existing?.activeSeconds ?? 0);

  const payload = {
    survey_id: surveyId,
    sample_id: params.sampleId,
    answers: params.answers,
    active_question_id: params.activeQuestionId,
    updated_by: params.updatedBy,
    updated_at: new Date().toISOString(),
    started_at: startedAt,
    active_seconds: activeSeconds,
  };

  let { error } = await admin.from("survey_response_drafts").upsert(payload, {
    onConflict: "sample_id",
  });

  if (error?.message?.includes("active_seconds")) {
    const withoutActive = omit(payload, ["active_seconds"]);
    const retry = await admin.from("survey_response_drafts").upsert(withoutActive, {
      onConflict: "sample_id",
    });
    error = retry.error;
    if (error?.message?.includes("started_at")) {
      const withoutStarted = omit(withoutActive, ["started_at"]);
      error = (
        await admin.from("survey_response_drafts").upsert(withoutStarted, {
          onConflict: "sample_id",
        })
      ).error;
    }
  } else if (error?.message?.includes("started_at")) {
    const withoutStarted = omit(payload, ["started_at", "active_seconds"]);
    error = (
      await admin.from("survey_response_drafts").upsert(withoutStarted, {
        onConflict: "sample_id",
      })
    ).error;
  }

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteCatiDraft(sampleId: string): Promise<void> {
  const admin = createSupabaseServiceRoleClient();
  await admin.from("survey_response_drafts").delete().eq("sample_id", sampleId);
}
