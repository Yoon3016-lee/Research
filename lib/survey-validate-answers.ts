import type { PublicSurveyDetail, SurveyAnswerInput } from "@/lib/survey-public";
import { isLikert7Value, isStarRatingValue } from "@/lib/survey-types";
import {
  branchingSnapshotFromAnswers,
  buildParticipantDisplayNumbers,
  isQuestionShownInSurvey,
} from "@/lib/survey-visibility";

type PublicQuestion = PublicSurveyDetail["questions"][number];

function questionLabel(
  q: PublicQuestion,
  displayNumbers: Map<string, number>,
  fallback: number,
): number {
  return displayNumbers.get(q.id) ?? fallback;
}

function validateOneAnswer(
  q: PublicQuestion,
  a: SurveyAnswerInput | undefined,
  n: number,
): string | null {
  if (q.type === "info_media") {
    return null;
  }

  if (!a) {
    if (q.allowSkip) return null;
    return `문항 ${n}: 답변을 입력하세요.`;
  }
  if (a.type !== q.type) {
    return `문항 ${n}: 답변 형식이 올바르지 않습니다.`;
  }

  if (q.type === "mc_single") {
    if (a.type !== "mc_single") return null;
    const empty = !a.optionId?.trim();
    if (empty && !q.allowSkip) return `문항 ${n}: 보기를 선택하세요.`;
    if (!empty && !q.options.some((o) => o.id === a.optionId)) {
      return `문항 ${n}: 잘못된 선택입니다.`;
    }
    const otherOpt = q.options.find((o) => o.isOther);
    if (otherOpt && a.optionId === otherOpt.id && !(a.otherText?.trim())) {
      return `문항 ${n}: 기타 내용을 입력하세요.`;
    }
  }

  if (q.type === "mc_multi") {
    if (a.type !== "mc_multi") return null;
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
    const otherOpt = q.options.find((o) => o.isOther);
    if (otherOpt && ids.includes(otherOpt.id) && !(a.otherText?.trim())) {
      return `문항 ${n}: 기타 내용을 입력하세요.`;
    }
  }

  if (q.type === "text_single") {
    if (a.type !== "text_single") return null;
    const text = a.text?.trim() ?? "";
    if (!text && !q.allowSkip) return `문항 ${n}: 답변을 입력하세요.`;
  }

  if (q.type === "text_multi") {
    if (a.type !== "text_multi") return null;
    const values = a.values ?? {};
    if (q.options.length > 0) {
      const filled = q.options.filter((o) => (values[o.id] ?? "").trim().length > 0);
      if (filled.length === 0 && !q.allowSkip) {
        return `문항 ${n}: 항목을 입력하세요.`;
      }
      if (!q.allowSkip && filled.length < q.options.length) {
        return `문항 ${n}: ${q.options.length}개 항목을 모두 입력하세요.`;
      }
      for (const optionId of Object.keys(values)) {
        if (!q.options.some((o) => o.id === optionId)) {
          return `문항 ${n}: 잘못된 항목이 포함되어 있습니다.`;
        }
      }
    } else {
      const filled = Object.values(values).filter((v) => v.trim().length > 0).length;
      const legacyLines = (a.lines ?? []).map((l) => l.trim()).filter(Boolean).length;
      const filledCount = Math.max(filled, legacyLines);
      const required = q.textLineCount ?? 2;
      if (filledCount === 0 && !q.allowSkip) {
        return `문항 ${n}: 항목을 입력하세요.`;
      }
      if (!q.allowSkip && filledCount < required) {
        return `문항 ${n}: ${required}개의 답변 칸을 채워 주세요.`;
      }
    }
  }

  if (q.type === "likert_7") {
    if (a.type !== "likert_7") return null;
    const empty = a.value == null || Number.isNaN(a.value);
    if (empty && !q.allowSkip) {
      return `문항 ${n}: 1~7 중 하나를 선택하세요.`;
    }
    if (!empty && !isLikert7Value(a.value)) {
      return `문항 ${n}: 1~7 사이의 값만 선택할 수 있습니다.`;
    }
  }

  if (q.type === "dropdown") {
    if (a.type !== "dropdown") return null;
    const empty = !a.optionId?.trim();
    if (empty && !q.allowSkip) return `문항 ${n}: 항목을 선택하세요.`;
    if (!empty && !q.options.some((o) => o.id === a.optionId)) {
      return `문항 ${n}: 잘못된 선택입니다.`;
    }
  }

  if (q.type === "rank") {
    if (a.type !== "rank") return null;
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
    if (a.type !== "likert_multi") return null;
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
    if (a.type !== "star_rating") return null;
    const empty = a.value == null || Number.isNaN(a.value);
    if (empty && !q.allowSkip) {
      return `문항 ${n}: 별점을 선택하세요.`;
    }
    if (!empty && !isStarRatingValue(a.value)) {
      return `문항 ${n}: 별점은 0~5점(0.5 단위)만 선택할 수 있습니다.`;
    }
  }

  if (q.type === "contact_fields") {
    if (a.type !== "contact_fields") return null;
    const values = a.values ?? {};
    const filled = q.options.filter((o) => (values[o.id] ?? "").trim().length > 0);
    if (filled.length === 0 && !q.allowSkip) {
      return `문항 ${n}: 항목을 입력하세요.`;
    }
    if (!q.allowSkip && filled.length < q.options.length) {
      return `문항 ${n}: ${q.options.length}개 항목을 모두 입력하세요.`;
    }
    for (const optionId of Object.keys(values)) {
      if (!q.options.some((o) => o.id === optionId)) {
        return `문항 ${n}: 잘못된 항목이 포함되어 있습니다.`;
      }
    }
  }

  return null;
}

export function validateSurveyAnswers(
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

  for (let i = 0; i < survey.questions.length; i++) {
    const q = survey.questions[i];
    if (!isQuestionShownInSurvey(q, survey.questions, branchingSnapshot, isStaff)) {
      continue;
    }
    const n = questionLabel(q, displayNumbers, i + 1);
    const err = validateOneAnswer(q, byId.get(q.id), n);
    if (err) return err;
  }

  return null;
}

/** 페이지 넘김 시 현재 문항만 검증 */
export function validateSurveyQuestionAnswer(
  survey: PublicSurveyDetail,
  questionId: string,
  answers: SurveyAnswerInput[],
  isStaff: boolean,
): string | null {
  const branchingSnapshot = branchingSnapshotFromAnswers(answers);
  const displayNumbers = buildParticipantDisplayNumbers(
    survey.questions,
    branchingSnapshot,
    isStaff,
  );
  const q = survey.questions.find((item) => item.id === questionId);
  if (!q) return null;
  if (!isQuestionShownInSurvey(q, survey.questions, branchingSnapshot, isStaff)) {
    return null;
  }
  const orderIndex = survey.questions.findIndex((item) => item.id === questionId);
  const n = questionLabel(q, displayNumbers, orderIndex + 1);
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  return validateOneAnswer(q, byId.get(q.id), n);
}
