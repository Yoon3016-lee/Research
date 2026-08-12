import "server-only";

import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateSurveyPayload, DraftQuestion } from "@/lib/survey-types";
import { clampLikertScaleSize, normalizeLikertScaleLabels } from "@/lib/likert-scale";
import { buildSurveyPeriodPersist } from "@/lib/survey-period";
import { persistSurveyQuestions } from "@/lib/survey-persist";
import { cloneQuestionsAsTemplate } from "@/lib/survey-template";
import { createSurveyResponseBackup } from "@/lib/survey-response-backup";

type ExistingSurvey = {
  id: string;
  slug: string;
  title: string;
  root_survey_id?: string | null;
  response_count?: number;
};

const ARCHIVED_TITLE_SUFFIX = " (숨김)";

/** 종료·보존된 이전 버전 설문 제목 */
export function formatArchivedSurveyTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "(숨김)";
  if (trimmed.endsWith(ARCHIVED_TITLE_SUFFIX) || trimmed.endsWith("(숨김)")) {
    return trimmed;
  }
  return `${trimmed}${ARCHIVED_TITLE_SUFFIX}`;
}

export function makeSurveySlugFromTitle(title: string): string {
  const t = title
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .slice(0, 48);
  const base = t.length > 0 ? t : "survey";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

/**
 * 응답 보존을 위해 문항 구조·내용이 바뀌었는지 비교합니다.
 * 제목·기간 등 설문 메타와 문항 UUID(clientId)는 제외합니다.
 */
export function surveyQuestionsContentEqual(
  a: DraftQuestion[],
  b: DraftQuestion[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (normalizeQuestionFingerprint(a[i]) !== normalizeQuestionFingerprint(b[i])) {
      return false;
    }
  }
  return true;
}

function normalizeQuestionFingerprint(q: DraftQuestion): string {
  const type = q.type;
  const options = (q.options ?? []).map((o) => o.trim());
  const nonEmptyOptions = options.filter(Boolean);
  const ends = q.optionEndsSurvey ?? [];

  let maxSelections: number | null = q.maxSelections ?? null;
  let likertScaleLabels: string[] = [];
  if (type === "likert_7" || type === "likert_multi") {
    const scaleSize = clampLikertScaleSize(maxSelections);
    maxSelections = scaleSize;
    likertScaleLabels = normalizeLikertScaleLabels(q.likertScaleLabels ?? [], scaleSize).map(
      (l) => l.trim(),
    );
  }

  let textLineCount: number | null = null;
  if (type === "text_multi") {
    textLineCount = Math.max(1, nonEmptyOptions.length || q.textLineCount || 2);
  }

  return JSON.stringify({
    type,
    prompt: q.prompt.trim(),
    allowSkip: Boolean(q.allowSkip),
    staffOnly: Boolean(q.staffOnly),
    visibilityRules: (q.visibilityRules ?? []).map((r) => ({
      sourceOrderIndex: r.sourceOrderIndex,
      optionIndex: r.optionIndex,
    })),
    options: nonEmptyOptions,
    optionEndsSurvey: nonEmptyOptions.map((_, i) => {
      const srcIndex = options.indexOf(nonEmptyOptions[i]);
      return Boolean(ends[srcIndex >= 0 ? srcIndex : i]);
    }),
    otherOptionEnabled: Boolean(q.otherOptionEnabled),
    otherOptionLabel: (q.otherOptionLabel ?? "기타").trim() || "기타",
    maxSelections,
    textLineCount,
    infoBody: (q.infoBody ?? "").trim(),
    mediaPath: q.mediaPath?.trim() || null,
    mediaType: q.mediaType ?? null,
    likertScaleLabels,
  });
}

export async function surveyHasStoredResponses(
  admin: SupabaseClient,
  surveyId: string,
  responseCountField: number,
): Promise<boolean> {
  if (responseCountField > 0) return true;

  const { count, error } = await admin
    .from("survey_responses")
    .select("*", { count: "exact", head: true })
    .eq("survey_id", surveyId);

  if (error) {
    console.error("[survey-version] response count:", error.message);
    return responseCountField > 0;
  }

  return (count ?? 0) > 0;
}

function isVersionColumnError(message: string): boolean {
  return (
    message.includes("root_survey_id") ||
    message.includes("supersedes_survey_id") ||
    message.includes("successor_survey_id")
  );
}

/**
 * 응답이 있는 설문에서 문항이 바뀐 경우: 새 설문·문항 ID로 생성하고
 * 기존 설문은 종료·비공개로 보존합니다.
 */
export async function forkSurveyOnEdit(
  admin: SupabaseClient,
  existing: ExistingSurvey,
  payload: CreateSurveyPayload,
  options?: { createdBy?: string | null },
): Promise<
  | { ok: true; slug: string; previousSlug: string; surveyId: string }
  | { ok: false; error: string }
> {
  const periodBuilt = buildSurveyPeriodPersist(payload.periodStart, payload.periodEnd);
  if (!periodBuilt.ok) return { ok: false, error: periodBuilt.error };

  const backupResult = await createSurveyResponseBackup(
    admin,
    existing.slug,
    "before_edit",
    { label: "버전 분기 직전 자동 백업", createdBy: options?.createdBy ?? null },
  );
  if (!backupResult.ok) {
    console.error("[survey-version] backup before fork:", backupResult.error);
  }

  const newSlug = makeSurveySlugFromTitle(payload.title);
  const rootSurveyId = existing.root_survey_id ?? existing.id;
  const clonedQuestions = cloneQuestionsAsTemplate(payload.questions);

  const participationFormat = payload.participationFormat === "email" ? "email" : "site";
  const insertRow = {
    slug: newSlug,
    title: payload.title.trim(),
    summary: payload.summary.trim(),
    period_start: periodBuilt.data.periodStart,
    period_end: periodBuilt.data.periodEnd,
    period_label: periodBuilt.data.periodLabel,
    target_count: Math.max(0, payload.targetCount),
    status: periodBuilt.data.status,
    listed_public: participationFormat === "email" ? false : payload.listedPublic,
    participation_format: participationFormat,
    response_script: payload.responseScript.trim(),
    ksic_code: (payload.ksicCode ?? "").trim(),
    ksic_name: (payload.ksicName ?? "").trim(),
    response_count: 0,
    root_survey_id: rootSurveyId,
    supersedes_survey_id: existing.id,
  };

  const { data: newSurvey, error: insertError } = await admin
    .from("surveys")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertError && isVersionColumnError(insertError.message)) {
    return {
      ok: false,
      error:
        "DB에 설문 버전 컬럼이 없습니다. supabase/migrations/20260409400000_survey_versions.sql 을 실행하세요.",
    };
  }

  if (insertError || !newSurvey) {
    return { ok: false, error: insertError?.message ?? "새 설문 생성에 실패했습니다." };
  }

  const newSurveyId = newSurvey.id as string;

  const persistError = await persistSurveyQuestions(admin, newSurveyId, clonedQuestions);
  if (persistError) {
    await admin.from("surveys").delete().eq("id", newSurveyId);
    return { ok: false, error: persistError };
  }

  const { error: archiveError } = await admin
    .from("surveys")
    .update({
      title: formatArchivedSurveyTitle(existing.title),
      status: "종료",
      listed_public: false,
      successor_survey_id: newSurveyId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (archiveError) {
    if (isVersionColumnError(archiveError.message)) {
      return {
        ok: false,
        error:
          "DB에 설문 버전 컬럼이 없습니다. supabase/migrations/20260409400000_survey_versions.sql 을 실행하세요.",
      };
    }
    console.error("[survey-version] archive old survey:", archiveError.message);
    return {
      ok: false,
      error: `새 설문은 생성되었지만 기존 설문 종료에 실패했습니다: ${archiveError.message}`,
    };
  }

  return {
    ok: true,
    slug: newSlug,
    previousSlug: existing.slug,
    surveyId: newSurveyId,
  };
}
