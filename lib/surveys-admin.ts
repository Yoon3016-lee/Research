import "server-only";

import { parseStoredVisibilityRules } from "@/lib/survey-visibility";
import type { CreateSurveyPayload, DraftQuestion, QuestionType } from "@/lib/survey-types";
import { normalizeStoredDate } from "@/lib/survey-period";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SurveyEditBundle = CreateSurveyPayload & {
  slug: string;
  responseCount: number;
};

export type SurveyEditLoad =
  | { ok: true; bundle: SurveyEditBundle }
  | { ok: false; reason: "not_configured" | "not_found" | "db_error"; message?: string };

type SurveyRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  target_count: number;
  status: string;
  listed_public: boolean;
  response_count: number;
  response_script: string;
};

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  allow_skip: boolean;
  staff_only?: boolean;
  visibility_rules?: unknown;
  max_selections: number | null;
  text_line_count: number | null;
  info_body?: string | null;
  media_url?: string | null;
  media_path?: string | null;
  media_type?: string | null;
};

type OptionRow = {
  id?: string;
  question_id: string;
  order_index: number;
  label: string;
  is_other?: boolean | null;
  ends_survey?: boolean | null;
};

async function fetchSurveyRow(
  ref: string,
): Promise<{ row: SurveyRow | null; errorMessage?: string }> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) {
    return { row: null };
  }

  const select =
    "id, slug, title, summary, period_label, period_start, period_end, target_count, status, listed_public, response_count, response_script";

  const bySlug = await admin.from("surveys").select(select).eq("slug", normalized).maybeSingle();
  if (bySlug.error) {
    console.error("[loadSurveyForEdit] slug lookup:", bySlug.error.message);
    return { row: null, errorMessage: bySlug.error.message };
  }
  if (bySlug.data) {
    return { row: bySlug.data as SurveyRow };
  }

  if (isUuid(normalized)) {
    const byId = await admin.from("surveys").select(select).eq("id", normalized).maybeSingle();
    if (byId.error) {
      console.error("[loadSurveyForEdit] id lookup:", byId.error.message);
      return { row: null, errorMessage: byId.error.message };
    }
    if (byId.data) {
      return { row: byId.data as SurveyRow };
    }
  }

  return { row: null };
}

export async function loadSurveyForEdit(ref: string): Promise<SurveyEditLoad> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, reason: "not_configured" };
  }

  let surveyRow: SurveyRow | null;
  try {
    const fetched = await fetchSurveyRow(ref);
    surveyRow = fetched.row;
    if (!surveyRow && fetched.errorMessage) {
      return { ok: false, reason: "db_error", message: fetched.errorMessage };
    }
  } catch (err) {
    console.error("[loadSurveyForEdit]", err);
    return { ok: false, reason: "db_error" };
  }

  if (!surveyRow) {
    return { ok: false, reason: "not_found" };
  }

  const admin = createSupabaseServiceRoleClient();

  const { data: qRowsRaw, error: qError } = await admin
    .from("survey_questions")
    .select(
      "id, order_index, prompt, question_type, allow_skip, staff_only, visibility_rules, max_selections, text_line_count, info_body, media_url, media_path, media_type",
    )
    .eq("survey_id", surveyRow.id)
    .order("order_index", { ascending: true });

  let questions: QuestionRow[] = [];
  if (
    qError &&
    (qError.message.includes("info_body") ||
      qError.message.includes("media_url") ||
      qError.message.includes("media_path") ||
      qError.message.includes("media_type"))
  ) {
    const fallback = await admin
      .from("survey_questions")
      .select(
        "id, order_index, prompt, question_type, allow_skip, staff_only, visibility_rules, max_selections, text_line_count",
      )
      .eq("survey_id", surveyRow.id)
      .order("order_index", { ascending: true });
    questions = (fallback.data ?? []) as QuestionRow[];
    if (fallback.error) {
      console.error("[loadSurveyForEdit] questions:", fallback.error.message);
    }
  } else if (qError) {
    console.error("[loadSurveyForEdit] questions:", qError.message);
  } else {
    questions = (qRowsRaw ?? []) as QuestionRow[];
  }

  const questionIds = questions.map((q) => q.id);
  let optionRows: OptionRow[] = [];

  if (questionIds.length > 0) {
    const { data: opts, error: oError } = await admin
      .from("survey_question_options")
      .select("id, question_id, order_index, label, is_other, ends_survey")
      .in("question_id", questionIds)
      .order("order_index", { ascending: true });

    if (oError) {
      if (oError.message.includes("ends_survey")) {
        const withoutEnds = await admin
          .from("survey_question_options")
          .select("id, question_id, order_index, label, is_other")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true });
        if (withoutEnds.error?.message.includes("is_other")) {
          const fallback = await admin
            .from("survey_question_options")
            .select("id, question_id, order_index, label")
            .in("question_id", questionIds)
            .order("order_index", { ascending: true });
          if (fallback.error) {
            console.error("[loadSurveyForEdit] options:", fallback.error.message);
          } else {
            optionRows = (fallback.data ?? []) as OptionRow[];
          }
        } else if (withoutEnds.error) {
          console.error("[loadSurveyForEdit] options:", withoutEnds.error.message);
        } else {
          optionRows = (withoutEnds.data ?? []) as OptionRow[];
        }
      } else if (oError.message.includes("is_other")) {
        const fallback = await admin
          .from("survey_question_options")
          .select("id, question_id, order_index, label")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true });
        if (fallback.error) {
          console.error("[loadSurveyForEdit] options:", fallback.error.message);
        } else {
          optionRows = (fallback.data ?? []) as OptionRow[];
        }
      } else {
        console.error("[loadSurveyForEdit] options:", oError.message);
      }
    } else {
      optionRows = (opts ?? []) as OptionRow[];
    }
  }

  const optionsByQuestion = new Map<
    string,
    {
      labels: string[];
      ends: boolean[];
      ids: (string | null)[];
      otherLabel: string | null;
      otherId: string | null;
    }
  >();
  for (const o of optionRows) {
    const entry = optionsByQuestion.get(o.question_id) ?? {
      labels: [],
      ends: [],
      ids: [],
      otherLabel: null,
      otherId: null,
    };
    if (o.is_other) {
      entry.otherLabel = o.label;
      entry.otherId = o.id ?? null;
    } else {
      entry.labels.push(o.label);
      entry.ends.push(Boolean(o.ends_survey));
      entry.ids.push(o.id ?? null);
    }
    optionsByQuestion.set(o.question_id, entry);
  }

  const draftQuestions: DraftQuestion[] = questions.map((q) => {
    const type = q.question_type as QuestionType;
    const entry = optionsByQuestion.get(q.id);
    const opts = entry?.labels ?? [];
    const ends = entry?.ends ?? [];
    const ids = entry?.ids ?? [];
    const otherLabel = entry?.otherLabel ?? null;
    const otherEnabled =
      (type === "mc_single" || type === "mc_multi") && Boolean(otherLabel);
    const optionCountForMax = opts.length + (otherEnabled ? 1 : 0);
    const resolvedOptions =
      type === "likert_7"
        ? [opts[0] ?? "", opts[1] ?? ""]
        : opts.length > 0
          ? opts
          : type === "mc_single" ||
              type === "mc_multi" ||
              type === "dropdown" ||
              type === "rank" ||
              type === "likert_multi" ||
              type === "contact_fields" ||
              type === "text_multi"
            ? type === "contact_fields"
              ? ["연락처", "이름", "소속 부서"]
              : type === "text_multi"
                ? Array.from(
                    { length: Math.max(2, q.text_line_count ?? 2) },
                    (_, i) => `항목 ${i + 1}`,
                  )
                : ["", ""]
            : [];
    const resolvedIds =
      type === "likert_7"
        ? [ids[0] ?? null, ids[1] ?? null]
        : opts.length > 0
          ? resolvedOptions.map((_, i) => ids[i] ?? null)
          : resolvedOptions.map(() => null);
    return {
      clientId: q.id,
      type,
      prompt: q.prompt,
      allowSkip: q.allow_skip,
      staffOnly: q.staff_only ?? false,
      visibilityRules: parseStoredVisibilityRules(q.visibility_rules),
      options: resolvedOptions,
      optionIds: resolvedIds,
      optionEndsSurvey: resolvedOptions.map((_, i) => Boolean(ends[i])),
      otherOptionEnabled: otherEnabled,
      otherOptionLabel: otherLabel?.trim() || "기타",
      otherOptionId: otherEnabled ? (entry?.otherId ?? null) : null,
      maxSelections:
        type === "rank"
          ? (q.max_selections ?? Math.min(3, opts.length || 3))
          : (q.max_selections ?? Math.min(2, optionCountForMax || 2)),
      textLineCount:
        type === "text_multi"
          ? Math.max(1, resolvedOptions.filter((o) => o.trim()).length || q.text_line_count || 2)
          : (q.text_line_count ?? 1),
      infoBody: q.info_body ?? "",
      mediaUrl: q.media_url ?? null,
      mediaPath: q.media_path ?? null,
      mediaType:
        q.media_type === "image" || q.media_type === "video" ? q.media_type : null,
    };
  });

  return {
    ok: true,
    bundle: {
      slug: surveyRow.slug,
      responseCount: surveyRow.response_count,
      title: surveyRow.title,
      summary: surveyRow.summary,
      periodStart: normalizeStoredDate(surveyRow.period_start),
      periodEnd: normalizeStoredDate(surveyRow.period_end),
      targetCount: surveyRow.target_count,
      listedPublic: surveyRow.listed_public,
      responseScript: surveyRow.response_script ?? "",
      questions: draftQuestions,
    },
  };
}
