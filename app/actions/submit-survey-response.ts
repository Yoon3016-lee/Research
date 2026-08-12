"use server";

import { revalidatePath } from "next/cache";
import type { PublicSurveyDetail, SurveyAnswerInput } from "@/lib/survey-public";
import { loadSurveyForEmailInvite } from "@/lib/survey-public";
import { clampLikertScaleSize, isLikertScaleValue } from "@/lib/likert-scale";
import { isStarRatingValue } from "@/lib/survey-types";
import { deleteCatiDraft } from "@/lib/cati-drafts";
import { getSurveyParticipant, resolveRespondentForInsert } from "@/lib/participant";
import { validateSurveyAnswers } from "@/lib/survey-validate-answers";
import {
  branchingSnapshotFromAnswers,
  isQuestionShownInSurvey,
} from "@/lib/survey-visibility";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { archiveSurveyResponseOnSubmit } from "@/lib/survey-response-backup";
import { getPublicSurveyBySlug } from "@/lib/survey-public";
import { resolveSurveyDuration } from "@/lib/survey-duration";

export type SubmitSurveyAfter = "stay" | "list" | "thanks";

export type SubmitSurveyOptions = {
  sampleId?: string;
  inviteToken?: string;
  /** 설문 화면을 연 시각 (ISO) */
  startedAt?: string;
  /** 설문이 화면에 열려 있는 동안 누적한 초 */
  activeSeconds?: number;
};

export type SubmitSurveyState =
  | { error: string; ok?: undefined }
  | { ok: true; after: SubmitSurveyAfter; error?: undefined };

function toAnswerJson(
  q: PublicSurveyDetail["questions"][number],
  a: SurveyAnswerInput,
): Record<string, unknown> | null {
  const qType = q.type;
  const scaleSize = clampLikertScaleSize(q.maxSelections);
  if (qType === "mc_single" && a.type === "mc_single") {
    if (!a.optionId?.trim()) return null;
    const otherText = a.otherText?.trim();
    return otherText
      ? { optionId: a.optionId, otherText }
      : { optionId: a.optionId };
  }
  if (qType === "mc_multi" && a.type === "mc_multi") {
    const optionIds = [...new Set(a.optionIds.filter(Boolean))];
    if (optionIds.length === 0) return null;
    const otherText = a.otherText?.trim();
    return otherText
      ? { optionIds, otherText }
      : { optionIds };
  }
  if (qType === "text_single" && a.type === "text_single") {
    const text = a.text?.trim() ?? "";
    if (!text) return null;
    return { text };
  }
  if (qType === "text_multi" && a.type === "text_multi") {
    if (a.values && typeof a.values === "object") {
      const values: Record<string, string> = {};
      for (const [k, v] of Object.entries(a.values)) {
        const t = String(v ?? "").trim();
        if (t) values[k] = t;
      }
      if (Object.keys(values).length === 0) return null;
      return { values };
    }
    const lines = (a.lines ?? []).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    return { lines };
  }
  if (qType === "likert_7" && a.type === "likert_7") {
    if (a.value == null || !isLikertScaleValue(a.value, scaleSize)) return null;
    return { value: a.value };
  }
  if (qType === "dropdown" && a.type === "dropdown") {
    if (!a.optionId?.trim()) return null;
    return { optionId: a.optionId };
  }
  if (qType === "rank" && a.type === "rank") {
    const rankedOptionIds = a.rankedOptionIds.filter(Boolean);
    if (rankedOptionIds.length === 0) return null;
    return { rankedOptionIds };
  }
  if (qType === "likert_multi" && a.type === "likert_multi") {
    const values: Record<string, number> = {};
    for (const [k, v] of Object.entries(a.values ?? {})) {
      if (v != null && isLikertScaleValue(v, scaleSize)) values[k] = v;
    }
    if (Object.keys(values).length === 0) return null;
    return { values };
  }
  if (qType === "star_rating" && a.type === "star_rating") {
    if (a.value == null || !isStarRatingValue(a.value)) return null;
    return { value: a.value };
  }
  if (qType === "contact_fields" && a.type === "contact_fields") {
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(a.values ?? {})) {
      const text = v?.trim() ?? "";
      if (text) values[k] = text;
    }
    if (Object.keys(values).length === 0) return null;
    return { values };
  }
  return null;
}

function formatResponseInsertError(message: string | undefined): string {
  if (!message) return "응답 저장에 실패했습니다.";
  if (message.includes("survey_responses_sample_id_unique")) {
    return "이미 이 설문에 참여하셨습니다.";
  }
  if (message.includes("started_at") || message.includes("duration_seconds")) {
    return (
      "DB에 응답 소요 시간 컬럼이 없습니다. " +
      "Supabase 대시보드 → SQL Editor에서 " +
      "supabase/migrations/20260410300000_survey_responses_duration.sql 내용을 실행한 뒤 다시 제출해 주세요."
    );
  }
  if (
    message.includes("respondent_kind") ||
    message.includes("respondent_user_id") ||
    message.includes("sample_id") ||
    message.includes("schema cache")
  ) {
    if (message.includes("sample_id")) {
      return (
        "DB에 CATI 표본 연결 컬럼(sample_id)이 없습니다. " +
        "Supabase 대시보드 → SQL Editor에서 " +
        "supabase/migrations/20260407800000_survey_responses_sample_id.sql 내용을 실행한 뒤 다시 제출해 주세요."
      );
    }
    return (
      "DB에 제출자 컬럼(respondent_kind)이 없습니다. " +
      "Supabase 대시보드 → SQL Editor에서 " +
      "supabase/migrations/20260407190000_survey_response_respondent.sql 내용을 실행한 뒤 다시 제출해 주세요."
    );
  }
  return message;
}

export async function submitSurveyResponseAction(
  slug: string,
  answers: SurveyAnswerInput[],
  after: SubmitSurveyAfter,
  options?: SubmitSurveyOptions,
): Promise<SubmitSurveyState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버 설정이 완료되지 않았습니다." };
  }

  const inviteToken = options?.inviteToken?.trim();
  let survey: PublicSurveyDetail | null = null;
  let resolvedSampleId: string | undefined = options?.sampleId;

  if (inviteToken) {
    const loaded = await loadSurveyForEmailInvite(slug, inviteToken);
    if (!loaded.ok) {
      if (loaded.reason === "already_responded") {
        return { error: "이미 이 설문에 참여하셨습니다." };
      }
      if (loaded.reason === "not_open") {
        return { error: "지금은 참여할 수 없습니다. 설문 기간을 확인해 주세요." };
      }
      return { error: "유효하지 않은 초대 링크입니다." };
    }
    survey = loaded.survey;
    resolvedSampleId = loaded.sampleId;
  } else {
    survey = await getPublicSurveyBySlug(slug);
  }

  if (!survey) {
    return { error: "진행중인 설문을 찾을 수 없습니다." };
  }
  if (survey.questions.length === 0) {
    return { error: "이 설문에는 응답할 문항이 없습니다." };
  }

  const participant = await getSurveyParticipant();
  const isStaff = participant.mode === "staff";
  const isEmailInvite = Boolean(inviteToken);

  if (resolvedSampleId && !isStaff && !isEmailInvite) {
    return { error: "CATI 표본 연결 제출은 직원 로그인이 필요합니다." };
  }

  const validationError = validateSurveyAnswers(survey, answers, isStaff);
  if (validationError) return { error: validationError };

  const admin = createSupabaseServiceRoleClient();

  if (resolvedSampleId) {
    const { data: existing } = await admin
      .from("survey_responses")
      .select("id")
      .eq("sample_id", resolvedSampleId)
      .maybeSingle();
    if (existing) {
      return { error: "이미 이 설문에 참여하셨습니다." };
    }
  }

  const respondent = await resolveRespondentForInsert();
  const branchingSnapshot = branchingSnapshotFromAnswers(answers);
  const submittedAt = new Date();
  const duration = resolveSurveyDuration(
    { startedAt: options?.startedAt, activeSeconds: options?.activeSeconds },
    submittedAt,
  );

  const insertRow: {
    survey_id: string;
    respondent_user_id: string | null;
    respondent_kind: string;
    sample_id?: string;
    started_at?: string | null;
    duration_seconds?: number | null;
  } = {
    survey_id: survey.id,
    respondent_user_id: respondent.respondent_user_id,
    respondent_kind: respondent.respondent_kind,
    started_at: duration.startedAt,
    duration_seconds: duration.durationSeconds,
  };
  if (resolvedSampleId) {
    insertRow.sample_id = resolvedSampleId;
  }

  let { data: response, error: resError } = await admin
    .from("survey_responses")
    .insert(insertRow)
    .select("id")
    .single();

  if (
    resError &&
    (resError.message.includes("started_at") ||
      resError.message.includes("duration_seconds"))
  ) {
    const { started_at: _startedAt, duration_seconds: _durationSeconds, ...withoutDuration } =
      insertRow;
    const retry = await admin
      .from("survey_responses")
      .insert(withoutDuration)
      .select("id")
      .single();
    response = retry.data;
    resError = retry.error;
  }

  if (resError || !response) {
    return { error: formatResponseInsertError(resError?.message) };
  }

  const responseId = response.id as string;
  const rows: { response_id: string; question_id: string; answer: Record<string, unknown> }[] =
    [];

  for (const q of survey.questions) {
    if (!isQuestionShownInSurvey(q, survey.questions, branchingSnapshot, isStaff)) {
      continue;
    }
    const a = answers.find((x) => x.questionId === q.id);
    if (!a) continue;
    const json = toAnswerJson(q, a);
    if (json) {
      rows.push({ response_id: responseId, question_id: q.id, answer: json });
    }
  }

  if (rows.length > 0) {
    const { error: ansError } = await admin.from("survey_response_answers").insert(rows);
    if (ansError) {
      return { error: ansError.message };
    }
  }

  await archiveSurveyResponseOnSubmit(admin, responseId, survey, rows, {
    respondent_kind: respondent.respondent_kind,
    respondent_user_id: respondent.respondent_user_id,
    sample_id: resolvedSampleId ?? null,
  });

  const { data: current } = await admin
    .from("surveys")
    .select("response_count")
    .eq("id", survey.id)
    .single();

  const nextCount = ((current?.response_count as number) ?? 0) + 1;
  await admin.from("surveys").update({ response_count: nextCount }).eq("id", survey.id);

  if (resolvedSampleId && !isEmailInvite) {
    await deleteCatiDraft(resolvedSampleId);
    revalidatePath("/admin/surveys/samples");
  }

  revalidatePath("/admin/backups");
  revalidatePath("/surveys");
  revalidatePath(`/survey/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/progress");

  const resolvedAfter: SubmitSurveyAfter = isEmailInvite ? "thanks" : after;
  return { ok: true, after: resolvedAfter };
}
