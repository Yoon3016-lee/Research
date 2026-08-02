"use server";

import { revalidatePath } from "next/cache";
import type { SurveyAnswerInput } from "@/lib/survey-public";
import { getPublicSurveyBySlug } from "@/lib/survey-public";
import { isLikert7Value, isStarRatingValue, type QuestionType } from "@/lib/survey-types";
import { deleteCatiDraft } from "@/lib/cati-drafts";
import { getSurveyParticipant, resolveRespondentForInsert } from "@/lib/participant";
import { validateSurveyAnswers } from "@/lib/survey-validate-answers";
import {
  branchingSnapshotFromAnswers,
  isQuestionShownInSurvey,
} from "@/lib/survey-visibility";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SubmitSurveyAfter = "stay" | "list";

export type SubmitSurveyState =
  | { error: string; ok?: undefined }
  | { ok: true; after: SubmitSurveyAfter; error?: undefined };

function toAnswerJson(
  qType: QuestionType,
  a: SurveyAnswerInput,
): Record<string, unknown> | null {
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
    const lines = (a.lines ?? []).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    return { lines };
  }
  if (qType === "likert_7" && a.type === "likert_7") {
    if (a.value == null || !isLikert7Value(a.value)) return null;
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
      if (v != null && isLikert7Value(v)) values[k] = v;
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
  sampleId?: string,
): Promise<SubmitSurveyState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버 설정이 완료되지 않았습니다." };
  }

  const survey = await getPublicSurveyBySlug(slug);
  if (!survey) {
    return { error: "진행중인 설문을 찾을 수 없습니다." };
  }
  if (survey.questions.length === 0) {
    return { error: "이 설문에는 응답할 문항이 없습니다." };
  }

  const participant = await getSurveyParticipant();
  const isStaff = participant.mode === "staff";

  if (sampleId && !isStaff) {
    return { error: "CATI 표본 연결 제출은 직원 로그인이 필요합니다." };
  }

  const validationError = validateSurveyAnswers(survey, answers, isStaff);
  if (validationError) return { error: validationError };

  const admin = createSupabaseServiceRoleClient();
  const respondent = await resolveRespondentForInsert();
  const branchingSnapshot = branchingSnapshotFromAnswers(answers);

  const insertRow: {
    survey_id: string;
    respondent_user_id: string | null;
    respondent_kind: string;
    sample_id?: string;
  } = {
    survey_id: survey.id,
    respondent_user_id: respondent.respondent_user_id,
    respondent_kind: respondent.respondent_kind,
  };
  if (sampleId) {
    insertRow.sample_id = sampleId;
  }

  const { data: response, error: resError } = await admin
    .from("survey_responses")
    .insert(insertRow)
    .select("id")
    .single();

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
    const json = toAnswerJson(q.type, a);
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

  const { data: current } = await admin
    .from("surveys")
    .select("response_count")
    .eq("id", survey.id)
    .single();

  const nextCount = ((current?.response_count as number) ?? 0) + 1;
  await admin.from("surveys").update({ response_count: nextCount }).eq("id", survey.id);

  if (sampleId) {
    // 컨택 결과(예: 성공)는 조사원이 선택 시 이미 기록됨. 제출 시에는 응답-표본 연결만 유지.
    // 제출 완료 → 저장해 둔 중도 중단 초안 제거.
    await deleteCatiDraft(sampleId);
    revalidatePath("/admin/surveys/samples");
  }

  revalidatePath("/surveys");
  revalidatePath(`/survey/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/progress");

  return { ok: true, after };
}
