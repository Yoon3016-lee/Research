"use server";

import { revalidatePath } from "next/cache";
import type { PublicSurveyDetail, SurveyAnswerInput } from "@/lib/survey-public";
import { getPublicSurveyBySlug } from "@/lib/survey-public";
import { isLikert7Value, isStarRatingValue, type QuestionType } from "@/lib/survey-types";
import { getSurveyParticipant, resolveRespondentForInsert } from "@/lib/participant";
import {
  branchingSnapshotFromAnswers,
  buildParticipantDisplayNumbers,
  isPublicQuestionVisible,
} from "@/lib/survey-visibility";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SubmitSurveyAfter = "stay" | "list";

export type SubmitSurveyState =
  | { error: string; ok?: undefined }
  | { ok: true; after: SubmitSurveyAfter; error?: undefined };

function validateAnswers(
  survey: PublicSurveyDetail,
  answers: SurveyAnswerInput[],
  isStaff: boolean,
): string | null {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  const branchingSnapshot = branchingSnapshotFromAnswers(answers);
  const displayNumbers = buildParticipantDisplayNumbers(
    survey.questions,
    branchingSnapshot,
    isStaff,
  );
  const qLabel = (q: PublicSurveyDetail["questions"][number], fallback: number) =>
    displayNumbers.get(q.id) ?? fallback;

  for (let i = 0; i < survey.questions.length; i++) {
    const q = survey.questions[i];
    if (!isPublicQuestionVisible(q, survey.questions, branchingSnapshot, isStaff)) {
      continue;
    }
    const a = byId.get(q.id);
    const n = qLabel(q, i + 1);

    if (!a) {
      if (q.allowSkip) continue;
      return `문항 ${n}: 답변을 입력하세요.`;
    }
    if (a.type !== q.type) {
      return `문항 ${n}: 답변 형식이 올바르지 않습니다.`;
    }

    if (q.type === "mc_single") {
      if (a.type !== "mc_single") continue;
      const empty = !a.optionId?.trim();
      if (empty && !q.allowSkip) return `문항 ${n}: 보기를 선택하세요.`;
      if (!empty && !q.options.some((o) => o.id === a.optionId)) {
        return `문항 ${n}: 잘못된 선택입니다.`;
      }
      if (empty && q.allowSkip) continue;
    }

    if (q.type === "mc_multi") {
      if (a.type !== "mc_multi") continue;
      const ids = [...new Set(a.optionIds.filter(Boolean))];
      if (ids.length === 0 && !q.allowSkip) {
        return `문항 ${n}: 보기를 하나 이상 선택하세요.`;
      }
      const max = q.maxSelections ?? ids.length;
      if (ids.length > max) {
        return `문항 ${n}: 최대 ${max}개까지 선택할 수 있습니다.`;
      }
      for (const id of ids) {
        if (!q.options.some((o) => o.id === id)) {
          return `문항 ${n}: 잘못된 선택이 포함되어 있습니다.`;
        }
      }
    }

    if (q.type === "text_single") {
      if (a.type !== "text_single") continue;
      const text = a.text?.trim() ?? "";
      if (!text && !q.allowSkip) return `문항 ${n}: 답변을 입력하세요.`;
    }

    if (q.type === "text_multi") {
      if (a.type !== "text_multi") continue;
      const lines = (a.lines ?? []).map((l) => l.trim());
      const filled = lines.filter(Boolean).length;
      const required = q.textLineCount ?? 2;
      if (filled === 0 && !q.allowSkip) {
        return `문항 ${n}: 답변을 하나 이상 입력하세요.`;
      }
      if (!q.allowSkip && filled < required) {
        return `문항 ${n}: ${required}개의 답변 칸을 채워 주세요.`;
      }
    }

    if (q.type === "likert_7") {
      if (a.type !== "likert_7") continue;
      const empty = a.value == null || Number.isNaN(a.value);
      if (empty && !q.allowSkip) {
        return `문항 ${n}: 1~7 중 하나를 선택하세요.`;
      }
      if (!empty && !isLikert7Value(a.value)) {
        return `문항 ${n}: 1~7 사이의 값만 선택할 수 있습니다.`;
      }
    }

    if (q.type === "dropdown") {
      if (a.type !== "dropdown") continue;
      const empty = !a.optionId?.trim();
      if (empty && !q.allowSkip) return `문항 ${n}: 항목을 선택하세요.`;
      if (!empty && !q.options.some((o) => o.id === a.optionId)) {
        return `문항 ${n}: 잘못된 선택입니다.`;
      }
    }

    if (q.type === "rank") {
      if (a.type !== "rank") continue;
      const ids = a.rankedOptionIds.filter(Boolean);
      const rankCount = q.maxSelections ?? ids.length;
      if (ids.length === 0 && !q.allowSkip) {
        return `문항 ${n}: ${rankCount}개 순위를 모두 선택하세요.`;
      }
      if (ids.length > 0 && ids.length !== rankCount) {
        return `문항 ${n}: ${rankCount}개 순위를 선택해야 합니다.`;
      }
      if (new Set(ids).size !== ids.length) {
        return `문항 ${n}: 같은 선택지를 중복 순위로 지정할 수 없습니다.`;
      }
      for (const id of ids) {
        if (!q.options.some((o) => o.id === id)) {
          return `문항 ${n}: 잘못된 선택이 포함되어 있습니다.`;
        }
      }
    }

    if (q.type === "likert_multi") {
      if (a.type !== "likert_multi") continue;
      const values = a.values ?? {};
      const answered = q.options.filter((o) => {
        const v = values[o.id];
        return v != null && !Number.isNaN(v);
      });
      if (answered.length === 0 && !q.allowSkip) {
        return `문항 ${n}: 모든 항목에 척도를 선택하세요.`;
      }
      if (!q.allowSkip && answered.length < q.options.length) {
        return `문항 ${n}: ${q.options.length}개 항목 모두 1~7 중 하나를 선택하세요.`;
      }
      for (const [optionId, value] of Object.entries(values)) {
        if (value == null || Number.isNaN(value)) continue;
        if (!q.options.some((o) => o.id === optionId)) {
          return `문항 ${n}: 잘못된 항목이 포함되어 있습니다.`;
        }
        if (!isLikert7Value(value)) {
          return `문항 ${n}: 1~7 사이의 값만 선택할 수 있습니다.`;
        }
      }
    }

    if (q.type === "star_rating") {
      if (a.type !== "star_rating") continue;
      const empty = a.value == null || Number.isNaN(a.value);
      if (empty && !q.allowSkip) {
        return `문항 ${n}: 별점을 선택하세요.`;
      }
      if (!empty && !isStarRatingValue(a.value)) {
        return `문항 ${n}: 별점은 0~5점(0.5 단위)만 선택할 수 있습니다.`;
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

  const participant = await getSurveyParticipant();
  const isStaff = participant.mode === "staff";

  const validationError = validateAnswers(survey, answers, isStaff);
  if (validationError) return { error: validationError };

  const admin = createSupabaseServiceRoleClient();
  const respondent = await resolveRespondentForInsert();
  const branchingSnapshot = branchingSnapshotFromAnswers(answers);

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
    if (!isPublicQuestionVisible(q, survey.questions, branchingSnapshot, isStaff)) {
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

  revalidatePath("/surveys");
  revalidatePath(`/survey/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/surveys");
  revalidatePath("/admin/progress");

  return { ok: true, after };
}
