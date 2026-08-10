import "server-only";

import {
  clampLikertScaleSize,
  MAX_LIKERT_SCALE_SIZE,
  MIN_LIKERT_SCALE_SIZE,
  normalizeLikertScaleLabels,
} from "@/lib/likert-scale";
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (q.type === "likert_7" || q.type === "likert_multi") {
    const scaleSize = clampLikertScaleSize(q.maxSelections);
    if (scaleSize < MIN_LIKERT_SCALE_SIZE || scaleSize > MAX_LIKERT_SCALE_SIZE) {
      return `문항 ${index + 1}: 척도 크기는 ${MIN_LIKERT_SCALE_SIZE}~${MAX_LIKERT_SCALE_SIZE} 사이여야 합니다.`;
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

function buildQuestionRow(
  surveyId: string,
  orderIndex: number,
  q: DraftQuestion,
): Record<string, unknown> {
  const visibilityRules =
    q.visibilityRules.length > 0
      ? q.visibilityRules.map((r) => ({
          sourceOrderIndex: r.sourceOrderIndex,
          optionIndex: r.optionIndex,
        }))
      : null;

  const row: Record<string, unknown> = {
    survey_id: surveyId,
    order_index: orderIndex,
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
  if (q.type === "likert_7" || q.type === "likert_multi") {
    const scaleSize = clampLikertScaleSize(q.maxSelections);
    row.max_selections = scaleSize;
    const labels = normalizeLikertScaleLabels(q.likertScaleLabels, scaleSize);
    row.likert_scale_labels = labels.some((l) => l.trim()) ? labels : null;
  }

  return row;
}

function stripMediaColumns(row: Record<string, unknown>): Record<string, unknown> {
  const legacyRow = { ...row };
  delete legacyRow.info_body;
  delete legacyRow.media_url;
  delete legacyRow.media_path;
  delete legacyRow.media_type;
  return legacyRow;
}

function isMediaColumnError(message: string): boolean {
  return (
    message.includes("info_body") ||
    message.includes("media_url") ||
    message.includes("media_path") ||
    message.includes("media_type") ||
    message.includes("info_media") ||
    message.includes("contact_fields")
  );
}

function isLikertColumnError(message: string): boolean {
  return message.includes("likert_scale_labels");
}

function stripLikertColumns(row: Record<string, unknown>): Record<string, unknown> {
  const legacy = { ...row };
  delete legacy.likert_scale_labels;
  return legacy;
}

function likertColumnMigrationHint(): string {
  return (
    "DB에 리커트 척도 라벨 컬럼(likert_scale_labels)이 없습니다. " +
    "supabase/migrations/20260410100000_survey_likert_scale_labels.sql 을 실행하세요."
  );
}

type ExistingOption = {
  id: string;
  order_index: number;
  label: string;
  is_other: boolean | null;
  ends_survey?: boolean | null;
};

async function insertOptionsForNewQuestion(
  admin: SupabaseClient,
  questionId: string,
  q: DraftQuestion,
): Promise<string | null> {
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

  return null;
}

async function syncOptionsPreservingIds(
  admin: SupabaseClient,
  questionId: string,
  q: DraftQuestion,
): Promise<string | null> {
  if (!OPTION_TYPES.includes(q.type)) {
    const { error } = await admin
      .from("survey_question_options")
      .delete()
      .eq("question_id", questionId);
    return error?.message ?? null;
  }

  const { data: existingRaw, error: loadErr } = await admin
    .from("survey_question_options")
    .select("id, order_index, label, is_other, ends_survey")
    .eq("question_id", questionId)
    .order("order_index", { ascending: true });

  if (loadErr?.message.includes("ends_survey")) {
    const fallback = await admin
      .from("survey_question_options")
      .select("id, order_index, label, is_other")
      .eq("question_id", questionId)
      .order("order_index", { ascending: true });
    if (fallback.error) return fallback.error.message;
    return syncOptionsPreservingIdsWithRows(
      admin,
      questionId,
      q,
      (fallback.data ?? []) as ExistingOption[],
    );
  }
  if (loadErr) return loadErr.message;

  return syncOptionsPreservingIdsWithRows(
    admin,
    questionId,
    q,
    (existingRaw ?? []) as ExistingOption[],
  );
}

async function syncOptionsPreservingIdsWithRows(
  admin: SupabaseClient,
  questionId: string,
  q: DraftQuestion,
  existing: ExistingOption[],
): Promise<string | null> {
  const keepIds = new Set<string>();
  const usedExisting = new Set<string>();

  {
    const paired = q.options
      .map((label, order_index) => ({
        label: label.trim(),
        preferredId: q.optionIds?.[order_index] ?? null,
        ends_survey:
          (q.type === "mc_single" || q.type === "dropdown") &&
          Boolean(q.optionEndsSurvey?.[order_index]),
      }))
      .filter((p) => p.label);

    const nonOther = existing.filter((o) => !o.is_other);

    for (let order_index = 0; order_index < paired.length; order_index++) {
      const p = paired[order_index];
      const byId =
        p.preferredId && !usedExisting.has(p.preferredId)
          ? nonOther.find((o) => o.id === p.preferredId)
          : undefined;
      const byOrder =
        !byId
          ? nonOther.find((o) => !usedExisting.has(o.id) && o.order_index === order_index)
          : undefined;
      const match = byId ?? byOrder;

      if (match) {
        usedExisting.add(match.id);
        keepIds.add(match.id);
        const updateRow: Record<string, unknown> = {
          label: p.label,
          order_index,
          is_other: false,
        };
        if (q.type === "mc_single" || q.type === "dropdown") {
          updateRow.ends_survey = p.ends_survey;
        }
        let { error } = await admin
          .from("survey_question_options")
          .update(updateRow)
          .eq("id", match.id);
        if (error?.message.includes("ends_survey")) {
          delete updateRow.ends_survey;
          const retry = await admin
            .from("survey_question_options")
            .update(updateRow)
            .eq("id", match.id);
          error = retry.error;
        }
        if (error) return error.message;
      } else {
        const insertRow: Record<string, unknown> = {
          question_id: questionId,
          order_index,
          label: p.label,
          is_other: false,
          ends_survey: p.ends_survey,
        };
        let { data, error } = await admin
          .from("survey_question_options")
          .insert(insertRow)
          .select("id")
          .single();
        if (error?.message.includes("ends_survey")) {
          delete insertRow.ends_survey;
          const retry = await admin
            .from("survey_question_options")
            .insert(insertRow)
            .select("id")
            .single();
          data = retry.data;
          error = retry.error;
        }
        if (error?.message.includes("is_other")) {
          delete insertRow.is_other;
          delete insertRow.ends_survey;
          const retry = await admin
            .from("survey_question_options")
            .insert(insertRow)
            .select("id")
            .single();
          data = retry.data;
          error = retry.error;
        }
        if (error) return error.message;
        if (data?.id) keepIds.add(data.id as string);
      }
    }

    const allowOther = q.type === "mc_single" || q.type === "mc_multi";
    if (allowOther && q.otherOptionEnabled) {
      const otherLabel = q.otherOptionLabel.trim() || "기타";
      const order_index = paired.length;
      const existingOther = existing.find((o) => o.is_other);
      const preferredOther =
        q.otherOptionId && existing.find((o) => o.id === q.otherOptionId);
      const match = preferredOther ?? existingOther;

      if (match) {
        keepIds.add(match.id);
        const { error } = await admin
          .from("survey_question_options")
          .update({
            label: otherLabel,
            order_index,
            is_other: true,
            ends_survey: false,
          })
          .eq("id", match.id);
        if (error?.message.includes("ends_survey")) {
          const retry = await admin
            .from("survey_question_options")
            .update({ label: otherLabel, order_index, is_other: true })
            .eq("id", match.id);
          if (retry.error) return retry.error.message;
        } else if (error) {
          return error.message;
        }
      } else {
        const insertRow: Record<string, unknown> = {
          question_id: questionId,
          order_index,
          label: otherLabel,
          is_other: true,
          ends_survey: false,
        };
        let { data, error } = await admin
          .from("survey_question_options")
          .insert(insertRow)
          .select("id")
          .single();
        if (error?.message.includes("ends_survey")) {
          delete insertRow.ends_survey;
          const retry = await admin
            .from("survey_question_options")
            .insert(insertRow)
            .select("id")
            .single();
          data = retry.data;
          error = retry.error;
        }
        if (error?.message.includes("is_other")) {
          return (
            "DB에 is_other 컬럼이 없습니다. " +
            "supabase/migrations/20260408500000_survey_question_options_is_other.sql 을 실행하세요."
          );
        }
        if (error) return error.message;
        if (data?.id) keepIds.add(data.id as string);
      }
    }
  }

  const toDelete = existing.filter((o) => !keepIds.has(o.id)).map((o) => o.id);
  if (toDelete.length > 0) {
    const { error } = await admin.from("survey_question_options").delete().in("id", toDelete);
    if (error) return error.message;
  }

  return null;
}

/** 신규 설문: 문항·보기를 모두 insert */
export async function persistSurveyQuestions(
  admin: SupabaseClient,
  surveyId: string,
  questions: DraftQuestion[],
): Promise<string | null> {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const row = buildQuestionRow(surveyId, i, q);

    let { data: qRow, error: qErr } = await admin
      .from("survey_questions")
      .insert(row)
      .select("id")
      .single();

    if (qErr && isMediaColumnError(qErr.message)) {
      if (q.type === "info_media" || q.type === "contact_fields") {
        return (
          "DB에 새 문항 유형 컬럼이 없습니다. " +
          "supabase/migrations/20260408600000_survey_info_media_contact_fields.sql 을 실행하세요."
        );
      }
      const legacy = await admin
        .from("survey_questions")
        .insert(stripMediaColumns(row))
        .select("id")
        .single();
      qRow = legacy.data;
      qErr = legacy.error;
    }

    if (qErr && isLikertColumnError(qErr.message)) {
      if (q.type === "likert_7" || q.type === "likert_multi") {
        return likertColumnMigrationHint();
      }
      const legacy = await admin
        .from("survey_questions")
        .insert(stripLikertColumns(row))
        .select("id")
        .single();
      qRow = legacy.data;
      qErr = legacy.error;
    }

    if (qErr || !qRow) {
      return qErr?.message ?? "문항 저장에 실패했습니다.";
    }

    const questionId = qRow.id as string;
    const optErr = await insertOptionsForNewQuestion(admin, questionId, q);
    if (optErr) return optErr;
  }

  return null;
}

/**
 * 설문 수정: 기존 문항·보기 UUID를 유지해 응답 답변이 CASCADE로 사라지지 않게 합니다.
 * 삭제된 문항에 답변이 남아 있으면 저장을 거부합니다.
 */
export async function persistSurveyQuestionsUpdate(
  admin: SupabaseClient,
  surveyId: string,
  questions: DraftQuestion[],
): Promise<string | null> {
  const { data: existingQs, error: loadErr } = await admin
    .from("survey_questions")
    .select("id")
    .eq("survey_id", surveyId);

  if (loadErr) return loadErr.message;

  const existingIds = new Set((existingQs ?? []).map((r) => r.id as string));
  const keepIds = new Set(
    questions.map((q) => q.clientId).filter((id) => existingIds.has(id)),
  );
  const toDelete = [...existingIds].filter((id) => !keepIds.has(id));

  if (toDelete.length > 0) {
    const { count, error: countErr } = await admin
      .from("survey_response_answers")
      .select("*", { count: "exact", head: true })
      .in("question_id", toDelete);

    if (countErr) return countErr.message;
    if ((count ?? 0) > 0) {
      return (
        "이미 응답이 저장된 문항은 삭제할 수 없습니다. " +
        "해당 문항을 유지하거나, 응답을 삭제한 뒤 설문을 수정하세요."
      );
    }

    const { error: delErr } = await admin.from("survey_questions").delete().in("id", toDelete);
    if (delErr) {
      if (
        delErr.message.includes("foreign key") ||
        delErr.message.includes("restrict") ||
        delErr.code === "23503"
      ) {
        return (
          "이미 응답이 저장된 문항은 삭제할 수 없습니다. " +
          "해당 문항을 유지하거나, 응답을 삭제한 뒤 설문을 수정하세요."
        );
      }
      return delErr.message;
    }
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const row = buildQuestionRow(surveyId, i, q);
    const isExisting = existingIds.has(q.clientId);
    let questionId: string;

    if (isExisting) {
      let { error: uErr } = await admin
        .from("survey_questions")
        .update(row)
        .eq("id", q.clientId)
        .eq("survey_id", surveyId);

      if (uErr && isMediaColumnError(uErr.message)) {
        if (q.type === "info_media" || q.type === "contact_fields") {
          return (
            "DB에 새 문항 유형 컬럼이 없습니다. " +
            "supabase/migrations/20260408600000_survey_info_media_contact_fields.sql 을 실행하세요."
          );
        }
        const retry = await admin
          .from("survey_questions")
          .update(stripMediaColumns(row))
          .eq("id", q.clientId)
          .eq("survey_id", surveyId);
        uErr = retry.error;
      }
      if (uErr && isLikertColumnError(uErr.message)) {
        if (q.type === "likert_7" || q.type === "likert_multi") {
          return likertColumnMigrationHint();
        }
        const retry = await admin
          .from("survey_questions")
          .update(stripLikertColumns(row))
          .eq("id", q.clientId)
          .eq("survey_id", surveyId);
        uErr = retry.error;
      }
      if (uErr) return uErr.message;
      questionId = q.clientId;
    } else {
      const insertPayload =
        UUID_RE.test(q.clientId) ? { id: q.clientId, ...row } : row;

      let { data: qRow, error: qErr } = await admin
        .from("survey_questions")
        .insert(insertPayload)
        .select("id")
        .single();

      if (qErr && isMediaColumnError(qErr.message)) {
        if (q.type === "info_media" || q.type === "contact_fields") {
          return (
            "DB에 새 문항 유형 컬럼이 없습니다. " +
            "supabase/migrations/20260408600000_survey_info_media_contact_fields.sql 을 실행하세요."
          );
        }
        const legacy = await admin
          .from("survey_questions")
          .insert(
            UUID_RE.test(q.clientId)
              ? { id: q.clientId, ...stripMediaColumns(row) }
              : stripMediaColumns(row),
          )
          .select("id")
          .single();
        qRow = legacy.data;
        qErr = legacy.error;
      }

      if (qErr && isLikertColumnError(qErr.message)) {
        if (q.type === "likert_7" || q.type === "likert_multi") {
          return likertColumnMigrationHint();
        }
        const legacy = await admin
          .from("survey_questions")
          .insert(
            UUID_RE.test(q.clientId)
              ? { id: q.clientId, ...stripLikertColumns(row) }
              : stripLikertColumns(row),
          )
          .select("id")
          .single();
        qRow = legacy.data;
        qErr = legacy.error;
      }

      if (qErr || !qRow) {
        return qErr?.message ?? "문항 저장에 실패했습니다.";
      }
      questionId = qRow.id as string;
    }

    const optErr = isExisting
      ? await syncOptionsPreservingIds(admin, questionId, q)
      : await insertOptionsForNewQuestion(admin, questionId, q);
    if (optErr) return optErr;
  }

  return null;
}
