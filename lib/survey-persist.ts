import "server-only";

import type { DraftQuestion, QuestionType } from "@/lib/survey-types";
import { validateVisibilityRules } from "@/lib/survey-visibility";
import type { SupabaseClient } from "@supabase/supabase-js";

const OPTION_TYPES: QuestionType[] = [
  "mc_single",
  "mc_multi",
  "dropdown",
  "rank",
  "likert_multi",
  "contact_fields",
  "text_multi",
];

export function validateQuestion(
  q: DraftQuestion,
  index: number,
  allQuestions: DraftQuestion[],
): string | null {
  if (!q.prompt.trim()) {
    return `문항 ${index + 1}: 질문 내용을 입력하세요.`;
  }
  const visibilityErr = validateVisibilityRules(q, index, allQuestions);
  if (visibilityErr) return visibilityErr;
  if (q.type === "mc_single" || q.type === "mc_multi" || q.type === "dropdown") {
    const opts = q.options.map((o) => o.trim()).filter(Boolean);
    const otherOn =
      (q.type === "mc_single" || q.type === "mc_multi") && q.otherOptionEnabled;
    const otherLabel = q.otherOptionLabel.trim() || "기타";
    const total = opts.length + (otherOn ? 1 : 0);
    if (total < 2) {
      return `문항 ${index + 1}: 선택지를 2개 이상 입력하세요.`;
    }
    if (otherOn && !otherLabel) {
      return `문항 ${index + 1}: 기타 보기 문구를 입력하세요.`;
    }
    if (q.type === "mc_multi") {
      const max = q.maxSelections;
      if (max < 1 || max > total) {
        return `문항 ${index + 1}: 최대 선택 개수는 1~선택지 개수(${total}) 사이여야 합니다.`;
      }
    }
  }
  if (q.type === "rank") {
    const opts = q.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) {
      return `문항 ${index + 1}: 순위 선택은 선택지를 2개 이상 입력하세요.`;
    }
    const rankCount = q.maxSelections;
    if (rankCount < 1 || rankCount > opts.length) {
      return `문항 ${index + 1}: 순위 개수는 1~선택지 개수(${opts.length}) 사이여야 합니다.`;
    }
  }
  if (q.type === "likert_multi") {
    const rows = q.options.map((o) => o.trim()).filter(Boolean);
    if (rows.length < 2) {
      return `문항 ${index + 1}: 척도(다중)는 평가 항목을 2개 이상 입력하세요.`;
    }
  }
  if (q.type === "text_multi") {
    const rows = q.options.map((o) => o.trim()).filter(Boolean);
    if (rows.length < 1) {
      return `문항 ${index + 1}: 주관식(다중) 항목(주제)을 1개 이상 입력하세요.`;
    }
  }
  if (q.type === "info_media") {
    const hasBody = Boolean(q.infoBody.trim());
    const hasMedia = Boolean(q.mediaUrl?.trim());
    if (!hasBody && !hasMedia) {
      return `문항 ${index + 1}: 안내 본문 또는 그림/영상 중 하나 이상 넣어 주세요.`;
    }
  }
  if (q.type === "contact_fields") {
    const rows = q.options.map((o) => o.trim()).filter(Boolean);
    if (rows.length < 1) {
      return `문항 ${index + 1}: 연락처 항목(라벨)을 1개 이상 입력하세요.`;
    }
  }
  return null;
}

export async function persistSurveyQuestions(
  admin: SupabaseClient,
  surveyId: string,
  questions: DraftQuestion[],
): Promise<string | null> {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const visibilityRules =
      q.visibilityRules.length > 0
        ? q.visibilityRules.map((r) => ({
            sourceOrderIndex: r.sourceOrderIndex,
            optionIndex: r.optionIndex,
          }))
        : null;

    const row: Record<string, unknown> = {
      survey_id: surveyId,
      order_index: i,
      prompt: q.prompt.trim(),
      question_type: q.type,
      allow_skip: q.type === "info_media" ? true : q.allowSkip,
      staff_only: q.staffOnly,
      visibility_rules: visibilityRules,
      max_selections: null,
      text_line_count: null,
      info_body: null,
      media_url: null,
      media_path: null,
      media_type: null,
    };

    if (q.type === "mc_multi") {
      row.max_selections = q.maxSelections;
    }
    if (q.type === "rank") {
      row.max_selections = q.maxSelections;
    }
    if (q.type === "text_multi") {
      const n = q.options.map((o) => o.trim()).filter(Boolean).length;
      row.text_line_count = Math.max(1, n);
    }
    if (q.type === "info_media") {
      row.info_body = q.infoBody.trim() || null;
      row.media_url = q.mediaUrl?.trim() || null;
      row.media_path = q.mediaPath?.trim() || null;
      row.media_type = q.mediaType;
    }

    let { data: qRow, error: qErr } = await admin
      .from("survey_questions")
      .insert(row)
      .select("id")
      .single();

    if (
      qErr &&
      (qErr.message.includes("info_body") ||
        qErr.message.includes("media_url") ||
        qErr.message.includes("media_path") ||
        qErr.message.includes("media_type") ||
        qErr.message.includes("info_media") ||
        qErr.message.includes("contact_fields"))
    ) {
      if (q.type === "info_media" || q.type === "contact_fields") {
        return (
          "DB에 새 문항 유형 컬럼이 없습니다. " +
          "supabase/migrations/20260408600000_survey_info_media_contact_fields.sql 을 실행하세요."
        );
      }
      const legacyRow = { ...row };
      delete legacyRow.info_body;
      delete legacyRow.media_url;
      delete legacyRow.media_path;
      delete legacyRow.media_type;
      const legacy = await admin
        .from("survey_questions")
        .insert(legacyRow)
        .select("id")
        .single();
      qRow = legacy.data;
      qErr = legacy.error;
    }

    if (qErr || !qRow) {
      return qErr?.message ?? "문항 저장에 실패했습니다.";
    }

    const questionId = qRow.id as string;

    if (OPTION_TYPES.includes(q.type)) {
      const paired = q.options
        .map((label, order_index) => ({
          label: label.trim(),
          ends_survey:
            (q.type === "mc_single" || q.type === "dropdown") &&
            Boolean(q.optionEndsSurvey?.[order_index]),
        }))
        .filter((p) => p.label);
      const labels = paired.map((p) => p.label);
      const allowOther = q.type === "mc_single" || q.type === "mc_multi";
      const withOther =
        allowOther && q.otherOptionEnabled
          ? [
              ...paired.map((p, order_index) => ({
                question_id: questionId,
                order_index,
                label: p.label,
                is_other: false,
                ends_survey: p.ends_survey,
              })),
              {
                question_id: questionId,
                order_index: labels.length,
                label: q.otherOptionLabel.trim() || "기타",
                is_other: true,
                ends_survey: false,
              },
            ]
          : paired.map((p, order_index) => ({
              question_id: questionId,
              order_index,
              label: p.label,
              is_other: false,
              ends_survey: p.ends_survey,
            }));

      let { error: oErr } = await admin.from("survey_question_options").insert(withOther);
      if (oErr?.message.includes("ends_survey")) {
        return (
          "DB에 ends_survey 컬럼이 없습니다. " +
          "supabase/migrations/20260408700000_survey_question_options_ends_survey.sql 을 실행하세요."
        );
      }
      if (oErr?.message.includes("is_other")) {
        if (allowOther && q.otherOptionEnabled) {
          return (
            "DB에 is_other 컬럼이 없습니다. " +
            "supabase/migrations/20260408500000_survey_question_options_is_other.sql 을 실행하세요."
          );
        }
        const legacy = labels.map((label, order_index) => ({
          question_id: questionId,
          order_index,
          label,
        }));
        const legacyResult = await admin.from("survey_question_options").insert(legacy);
        oErr = legacyResult.error;
      }
      if (oErr) {
        return oErr.message;
      }
    }

    if (q.type === "likert_7") {
      const min = q.options[0]?.trim() ?? "";
      const max = q.options[1]?.trim() ?? "";
      const opts: { question_id: string; order_index: number; label: string }[] = [];
      if (min) opts.push({ question_id: questionId, order_index: 0, label: min });
      if (max) opts.push({ question_id: questionId, order_index: 1, label: max });
      if (opts.length > 0) {
        const { error: oErr } = await admin.from("survey_question_options").insert(opts);
        if (oErr) {
          return oErr.message;
        }
      }
    }
  }

  return null;
}
