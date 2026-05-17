import "server-only";

import type { DraftQuestion, QuestionType } from "@/lib/survey-types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function validateQuestion(q: DraftQuestion, index: number): string | null {
  if (!q.prompt.trim()) {
    return `문항 ${index + 1}: 질문 내용을 입력하세요.`;
  }
  if (q.type === "mc_single" || q.type === "mc_multi") {
    const opts = q.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) {
      return `문항 ${index + 1}: 객관식은 선택지를 2개 이상 입력하세요.`;
    }
    if (q.type === "mc_multi") {
      const max = q.maxSelections;
      if (max < 1 || max > opts.length) {
        return `문항 ${index + 1}: 최대 선택 개수는 1~선택지 개수(${opts.length}) 사이여야 합니다.`;
      }
    }
  }
  if (q.type === "text_multi") {
    if (q.textLineCount < 2) {
      return `문항 ${index + 1}: 주관식 다중 응답은 답변 줄을 2개 이상으로 하세요.`;
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
    const row: {
      survey_id: string;
      order_index: number;
      prompt: string;
      question_type: QuestionType;
      allow_skip: boolean;
      max_selections: number | null;
      text_line_count: number | null;
    } = {
      survey_id: surveyId,
      order_index: i,
      prompt: q.prompt.trim(),
      question_type: q.type,
      allow_skip: q.allowSkip,
      max_selections: null,
      text_line_count: null,
    };

    if (q.type === "mc_multi") {
      row.max_selections = q.maxSelections;
    }
    if (q.type === "text_multi") {
      row.text_line_count = q.textLineCount;
    }

    const { data: qRow, error: qErr } = await admin
      .from("survey_questions")
      .insert(row)
      .select("id")
      .single();

    if (qErr || !qRow) {
      return qErr?.message ?? "문항 저장에 실패했습니다.";
    }

    const questionId = qRow.id as string;

    if (q.type === "mc_single" || q.type === "mc_multi") {
      const labels = q.options.map((o) => o.trim()).filter(Boolean);
      const opts = labels.map((label, order_index) => ({
        question_id: questionId,
        order_index,
        label,
      }));
      const { error: oErr } = await admin.from("survey_question_options").insert(opts);
      if (oErr) {
        return oErr.message;
      }
    }
  }

  return null;
}
