import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { fetchAllPages, fetchAllSurveyResponseAnswers } from "@/lib/supabase-paginate";
import type { PublicSurveyDetail, PublicSurveyQuestion } from "@/lib/survey-public";
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/survey-types";

export type BackupSource = "manual" | "before_edit" | "auto_submit";

export type SurveyResponseArchivePayload = {
  response: {
    id: string;
    survey_id: string;
    submitted_at: string;
    respondent_kind: string;
    respondent_user_id: string | null;
    sample_id: string | null;
  };
  answers: {
    question_id: string;
    question_prompt: string;
    question_type: string;
    question_order: number;
    answer: Record<string, unknown>;
  }[];
};

export type SurveyResponseBackupPayload = {
  exportedAt: string;
  survey: {
    id: string;
    slug: string;
    title: string;
  };
  questions: {
    id: string;
    order_index: number;
    prompt: string;
    type: string;
    type_label: string;
    options: { id: string; order_index: number; label: string; is_other?: boolean }[];
  }[];
  responses: {
    id: string;
    submitted_at: string;
    respondent_kind: string;
    respondent_user_id: string | null;
    sample_id: string | null;
    answers: { question_id: string; answer: unknown }[];
  }[];
};

export type SurveyBackupSummary = {
  surveyId: string;
  surveySlug: string;
  surveyTitle: string;
  liveResponseCount: number;
  archiveCount: number;
  backupCount: number;
  lastArchiveAt: string | null;
  lastBackupAt: string | null;
};

export type SurveyBackupListItem = {
  id: string;
  surveySlug: string;
  surveyTitle: string;
  source: BackupSource;
  label: string | null;
  createdAt: string;
  responseCount: number;
  answerRowCount: number;
  createdByEmail: string | null;
};

type SurveyRow = { id: string; slug: string; title: string; response_count: number };

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
};

type OptionRow = {
  id: string;
  question_id: string;
  order_index: number;
  label: string;
  is_other?: boolean | null;
};

type ResponseRow = {
  id: string;
  submitted_at: string;
  respondent_kind: string;
  respondent_user_id: string | null;
  sample_id: string | null;
};

type AnswerRow = {
  response_id: string;
  question_id: string;
  answer: unknown;
};

async function fetchSurveyByRef(ref: string): Promise<SurveyRow | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  const select = "id, slug, title, response_count";
  const bySlug = await admin.from("surveys").select(select).eq("slug", normalized).maybeSingle();
  if (bySlug.data) return bySlug.data as SurveyRow;
  if (bySlug.error) return null;

  if (isUuid(normalized)) {
    const byId = await admin.from("surveys").select(select).eq("id", normalized).maybeSingle();
    if (byId.data) return byId.data as SurveyRow;
  }
  return null;
}

async function buildSurveyBackupPayload(
  admin: SupabaseClient,
  survey: SurveyRow,
): Promise<SurveyResponseBackupPayload | null> {
  const { data: questionRows, error: qError } = await admin
    .from("survey_questions")
    .select("id, order_index, prompt, question_type")
    .eq("survey_id", survey.id)
    .order("order_index", { ascending: true });

  if (qError) return null;

  const questionsRaw = (questionRows ?? []) as QuestionRow[];
  const questionIds = questionsRaw.map((q) => q.id);

  const optionsByQuestion = new Map<string, OptionRow[]>();
  if (questionIds.length > 0) {
    const { data: optRows } = await admin
      .from("survey_question_options")
      .select("id, question_id, order_index, label, is_other")
      .in("question_id", questionIds)
      .order("order_index", { ascending: true });

    for (const o of (optRows ?? []) as OptionRow[]) {
      const list = optionsByQuestion.get(o.question_id) ?? [];
      list.push(o);
      optionsByQuestion.set(o.question_id, list);
    }
  }

  const questions = questionsRaw.map((q) => {
    const type = q.question_type as QuestionType;
    const opts = optionsByQuestion.get(q.id) ?? [];
    return {
      id: q.id,
      order_index: q.order_index,
      prompt: q.prompt,
      type: q.question_type,
      type_label: QUESTION_TYPE_LABELS[type] ?? q.question_type,
      options: opts.map((o) => ({
        id: o.id,
        order_index: o.order_index,
        label: o.label,
        is_other: Boolean(o.is_other),
      })),
    };
  });

  let responsesRaw: ResponseRow[] = [];
  try {
    responsesRaw = await fetchAllPages<ResponseRow>(async (from, to) =>
      admin
        .from("survey_responses")
        .select("id, submitted_at, respondent_kind, respondent_user_id, sample_id")
        .eq("survey_id", survey.id)
        .order("submitted_at", { ascending: true })
        .range(from, to),
    );
  } catch {
    return null;
  }

  const responseIds = responsesRaw.map((r) => r.id);

  const answersByResponse = new Map<string, AnswerRow[]>();
  if (responseIds.length > 0) {
    try {
      const answerRows = await fetchAllSurveyResponseAnswers(admin, responseIds);
      for (const row of answerRows) {
        const list = answersByResponse.get(row.response_id) ?? [];
        list.push({
          response_id: row.response_id,
          question_id: row.question_id,
          answer: row.answer,
        });
        answersByResponse.set(row.response_id, list);
      }
    } catch {
      /* 답변 일부 누락 시에도 응답 메타는 백업 */
    }
  }

  const responses = responsesRaw.map((r) => ({
    id: r.id,
    submitted_at: r.submitted_at,
    respondent_kind: r.respondent_kind,
    respondent_user_id: r.respondent_user_id,
    sample_id: r.sample_id,
    answers: (answersByResponse.get(r.id) ?? []).map((a) => ({
      question_id: a.question_id,
      answer: a.answer,
    })),
  }));

  return {
    exportedAt: new Date().toISOString(),
    survey: {
      id: survey.id,
      slug: survey.slug,
      title: survey.title,
    },
    questions,
    responses,
  };
}

function questionMetaFromSurvey(questions: PublicSurveyQuestion[], questionId: string) {
  const q = questions.find((x) => x.id === questionId);
  return {
    prompt: q?.prompt ?? "",
    type: q?.type ?? "text_single",
    order: q?.orderIndex ?? 0,
  };
}

/** 제출 직후 단건 아카이브 (실패 시 제출은 유지) */
export async function archiveSurveyResponseOnSubmit(
  admin: SupabaseClient,
  responseId: string,
  survey: PublicSurveyDetail,
  answerRows: { question_id: string; answer: Record<string, unknown> }[],
  responseMeta: {
    respondent_kind: string;
    respondent_user_id: string | null;
    sample_id?: string | null;
    submitted_at?: string;
  },
): Promise<void> {
  const payload: SurveyResponseArchivePayload = {
    response: {
      id: responseId,
      survey_id: survey.id,
      submitted_at: responseMeta.submitted_at ?? new Date().toISOString(),
      respondent_kind: responseMeta.respondent_kind,
      respondent_user_id: responseMeta.respondent_user_id,
      sample_id: responseMeta.sample_id ?? null,
    },
    answers: answerRows.map((row) => {
      const meta = questionMetaFromSurvey(survey.questions, row.question_id);
      return {
        question_id: row.question_id,
        question_prompt: meta.prompt,
        question_type: meta.type,
        question_order: meta.order,
        answer: row.answer,
      };
    }),
  };

  const { error } = await admin.from("survey_response_archives").upsert(
    {
      response_id: responseId,
      survey_id: survey.id,
      survey_slug: survey.slug,
      survey_title: survey.title,
      payload,
    },
    { onConflict: "response_id" },
  );

  if (error) {
    console.error("[survey-response-backup] archive on submit:", error.message);
  }
}

/** 설문 전체 스냅샷 백업 */
export async function createSurveyResponseBackup(
  admin: SupabaseClient,
  surveyRef: string,
  source: BackupSource,
  options?: { label?: string; createdBy?: string | null },
): Promise<{ ok: true; backupId: string } | { ok: false; error: string }> {
  const survey = await fetchSurveyByRef(surveyRef);
  if (!survey) return { ok: false, error: "설문을 찾을 수 없습니다." };

  const payload = await buildSurveyBackupPayload(admin, survey);
  if (!payload) return { ok: false, error: "백업 데이터를 구성하지 못했습니다." };

  const answerRowCount = payload.responses.reduce((n, r) => n + r.answers.length, 0);

  const { data, error } = await admin
    .from("survey_response_backups")
    .insert({
      survey_id: survey.id,
      survey_slug: survey.slug,
      survey_title: survey.title,
      source,
      label: options?.label?.trim() || null,
      created_by: options?.createdBy ?? null,
      response_count: payload.responses.length,
      answer_row_count: answerRowCount,
      payload,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "백업 저장에 실패했습니다." };
  }

  return { ok: true, backupId: data.id as string };
}

export async function listSurveyBackupSummaries(): Promise<SurveyBackupSummary[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

  const admin = createSupabaseServiceRoleClient();
  const { data: surveys } = await admin
    .from("surveys")
    .select("id, slug, title, response_count")
    .order("updated_at", { ascending: false });

  if (!surveys?.length) return [];

  const surveyIds = surveys.map((s) => s.id as string);

  const { data: archiveRows } = await admin
    .from("survey_response_archives")
    .select("survey_id, archived_at")
    .in("survey_id", surveyIds);

  const { data: backupRows } = await admin
    .from("survey_response_backups")
    .select("survey_id, created_at")
    .in("survey_id", surveyIds);

  const archiveBySurvey = new Map<string, { count: number; last: string }>();
  for (const row of archiveRows ?? []) {
    const id = row.survey_id as string;
    const at = row.archived_at as string;
    const prev = archiveBySurvey.get(id);
    if (!prev) {
      archiveBySurvey.set(id, { count: 1, last: at });
    } else {
      archiveBySurvey.set(id, {
        count: prev.count + 1,
        last: at > prev.last ? at : prev.last,
      });
    }
  }

  const backupBySurvey = new Map<string, { count: number; last: string }>();
  for (const row of backupRows ?? []) {
    const id = row.survey_id as string;
    if (!id) continue;
    const at = row.created_at as string;
    const prev = backupBySurvey.get(id);
    if (!prev) {
      backupBySurvey.set(id, { count: 1, last: at });
    } else {
      backupBySurvey.set(id, {
        count: prev.count + 1,
        last: at > prev.last ? at : prev.last,
      });
    }
  }

  return (surveys as SurveyRow[]).map((s) => {
    const arch = archiveBySurvey.get(s.id);
    const bak = backupBySurvey.get(s.id);
    return {
      surveyId: s.id,
      surveySlug: s.slug,
      surveyTitle: s.title,
      liveResponseCount: s.response_count ?? 0,
      archiveCount: arch?.count ?? 0,
      backupCount: bak?.count ?? 0,
      lastArchiveAt: arch?.last ?? null,
      lastBackupAt: bak?.last ?? null,
    };
  });
}

export async function listSurveyBackupsForSurvey(surveyRef: string): Promise<SurveyBackupListItem[]> {
  const survey = await fetchSurveyByRef(surveyRef);
  if (!survey) return [];

  const admin = createSupabaseServiceRoleClient();
  const { data: rows } = await admin
    .from("survey_response_backups")
    .select(
      "id, survey_slug, survey_title, source, label, created_at, response_count, answer_row_count, created_by",
    )
    .eq("survey_id", survey.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const creatorIds = [...new Set((rows ?? []).map((r) => r.created_by).filter(Boolean))] as string[];
  const emailById = new Map<string, string>();

  if (creatorIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", creatorIds);
    for (const p of profiles ?? []) {
      if (p.email) emailById.set(p.id as string, p.email as string);
    }
  }

  return (rows ?? []).map((r) => ({
    id: r.id as string,
    surveySlug: r.survey_slug as string,
    surveyTitle: r.survey_title as string,
    source: r.source as BackupSource,
    label: (r.label as string | null) ?? null,
    createdAt: r.created_at as string,
    responseCount: r.response_count as number,
    answerRowCount: r.answer_row_count as number,
    createdByEmail: r.created_by
      ? (emailById.get(r.created_by as string) ?? null)
      : null,
  }));
}

export async function getSurveyBackupPayload(
  backupId: string,
): Promise<{ ok: true; payload: SurveyResponseBackupPayload; filename: string } | { ok: false }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false };

  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin
    .from("survey_response_backups")
    .select("survey_slug, payload")
    .eq("id", backupId)
    .maybeSingle();

  if (!data?.payload) return { ok: false };

  const slug = data.survey_slug as string;
  const date = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    payload: data.payload as SurveyResponseBackupPayload,
    filename: `${slug}_backup_${date}.json`,
  };
}

export async function exportSurveyArchivesJson(
  surveyRef: string,
): Promise<{ ok: true; buffer: Buffer; filename: string } | { ok: false; error: string }> {
  const survey = await fetchSurveyByRef(surveyRef);
  if (!survey) return { ok: false, error: "설문을 찾을 수 없습니다." };

  const admin = createSupabaseServiceRoleClient();
  const { data: rows } = await admin
    .from("survey_response_archives")
    .select("response_id, archived_at, payload")
    .eq("survey_id", survey.id)
    .order("archived_at", { ascending: true });

  const payload = {
    exportedAt: new Date().toISOString(),
    survey: { id: survey.id, slug: survey.slug, title: survey.title },
    archives: (rows ?? []).map((r) => ({
      response_id: r.response_id,
      archived_at: r.archived_at,
      payload: r.payload,
    })),
  };

  const date = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    buffer: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
    filename: `${survey.slug}_archives_${date}.json`,
  };
}
