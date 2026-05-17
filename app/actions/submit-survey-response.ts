"use server";

import { revalidatePath } from "next/cache";
import type { PublicSurveyDetail, SurveyAnswerInput } from "@/lib/survey-public";
import { getPublicSurveyBySlug } from "@/lib/survey-public";
import type { QuestionType } from "@/lib/survey-types";
import { resolveRespondentForInsert } from "@/lib/participant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SubmitSurveyAfter = "stay" | "list";

export type SubmitSurveyState =
  | { error: string; ok?: undefined }
  | { ok: true; after: SubmitSurveyAfter; error?: undefined };

function validateAnswers(
  survey: PublicSurveyDetail,
  answers: SurveyAnswerInput[],
): string | null {
  const byId = new Map(answers.map((a) => [a.questionId, a]));

  for (let i = 0; i < survey.questions.length; i++) {
    const q = survey.questions[i];
    const a = byId.get(q.id);

    if (!a) {
      if (q.allowSkip) continue;
      return `문항 ${i + 1}: 답변을 입력하세요.`;
    }
    if (a.type !== q.type) {
      return `문항 ${i + 1}: 답변 형식이 올바르지 않습니다.`;
    }

    if (q.type === "mc_single") {
      if (a.type !== "mc_single") continue;
      const empty = !a.optionId?.trim();
      if (empty && !q.allowSkip) return `문항 ${i + 1}: 보기를 선택하세요.`;
      if (!empty && !q.options.some((o) => o.id === a.optionId)) {
        return `문항 ${i + 1}: 잘못된 선택입니다.`;
      }
      if (empty && q.allowSkip) continue;
    }

    if (q.type === "mc_multi") {
      if (a.type !== "mc_multi") continue;
      const ids = [...new Set(a.optionIds.filter(Boolean))];
      if (ids.length === 0 && !q.allowSkip) {
        return `문항 ${i + 1}: 보기를 하나 이상 선택하세요.`;
      }
      const max = q.maxSelections ?? ids.length;
      if (ids.length > max) {
        return `문항 ${i + 1}: 최대 ${max}개까지 선택할 수 있습니다.`;
      }
      for (const id of ids) {
        if (!q.options.some((o) => o.id === id)) {
          return `문항 ${i + 1}: 잘못된 선택이 포함되어 있습니다.`;
        }
      }
    }

    if (q.type === "text_single") {
      if (a.type !== "text_single") continue;
      const text = a.text?.trim() ?? "";
      if (!text && !q.allowSkip) return `문항 ${i + 1}: 답변을 입력하세요.`;
    }

    if (q.type === "text_multi") {
      if (a.type !== "text_multi") continue;
      const lines = (a.lines ?? []).map((l) => l.trim());
      const filled = lines.filter(Boolean).length;
      const required = q.textLineCount ?? 2;
      if (filled === 0 && !q.allowSkip) {
        return `문항 ${i + 1}: 답변을 하나 이상 입력하세요.`;
      }
      if (!q.allowSkip && filled < required) {
        return `문항 ${i + 1}: ${required}개의 답변 칸을 채워 주세요.`;
      }
    }
  }

  return null;
}

function toAnswerJson(
  qType: QuestionType,
  a: SurveyAnswerInput,
): Record<string, unknown> | null {
  if (qType === "mc_single" && a.type === "mc_single") {
    if (!a.optionId?.trim()) return null;
    return { optionId: a.optionId };
  }
  if (qType === "mc_multi" && a.type === "mc_multi") {
    const optionIds = [...new Set(a.optionIds.filter(Boolean))];
    if (optionIds.length === 0) return null;
    return { optionIds };
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
  return null;
}

function formatResponseInsertError(message: string | undefined): string {
  if (!message) return "응답 저장에 실패했습니다.";
  if (
    message.includes("respondent_kind") ||
    message.includes("respondent_user_id") ||
    message.includes("schema cache")
  ) {
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

  const validationError = validateAnswers(survey, answers);
  if (validationError) return { error: validationError };

  const admin = createSupabaseServiceRoleClient();
  const respondent = await resolveRespondentForInsert();

  const { data: response, error: resError } = await admin
    .from("survey_responses")
    .insert({
      survey_id: survey.id,
      respondent_user_id: respondent.respondent_user_id,
      respondent_kind: respondent.respondent_kind,
    })
    .select("id")
    .single();

  if (resError || !response) {
    return { error: formatResponseInsertError(resError?.message) };
  }

  const responseId = response.id as string;
  const rows: { response_id: string; question_id: string; answer: Record<string, unknown> }[] =
    [];

  for (const q of survey.questions) {
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

  revalidatePath("/surveys");
  revalidatePath(`/survey/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/progress");

  return { ok: true, after };
}
