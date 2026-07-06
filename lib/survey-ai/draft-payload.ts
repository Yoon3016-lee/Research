import {
  createDraftQuestion,
  QUESTION_TYPES,
  type CreateSurveyPayload,
  type DraftQuestion,
  type QuestionType,
} from "@/lib/survey-types";
import type { SurveyAiDraftPayload } from "@/lib/survey-ai/types";

function isQuestionType(value: string): value is QuestionType {
  return (QUESTION_TYPES as readonly string[]).includes(value);
}

/** sessionStorage 복원 시 문항 필드 누락·clientId 없음 보정 */
export function rehydrateDraftQuestion(raw: Partial<DraftQuestion> & { type?: string }): DraftQuestion | null {
  if (!raw.type || !isQuestionType(raw.type)) return null;
  const base = createDraftQuestion(raw.type);
  return {
    ...base,
    ...raw,
    type: raw.type,
    clientId: raw.clientId?.trim() || base.clientId,
    prompt: typeof raw.prompt === "string" ? raw.prompt : base.prompt,
    allowSkip: Boolean(raw.allowSkip),
    staffOnly: Boolean(raw.staffOnly),
    visibilityRules: Array.isArray(raw.visibilityRules) ? raw.visibilityRules : [],
    options: Array.isArray(raw.options) ? raw.options.map((o) => String(o)) : base.options,
    maxSelections:
      typeof raw.maxSelections === "number" && Number.isFinite(raw.maxSelections)
        ? raw.maxSelections
        : base.maxSelections,
    textLineCount:
      typeof raw.textLineCount === "number" && Number.isFinite(raw.textLineCount)
        ? raw.textLineCount
        : base.textLineCount,
  };
}

export function rehydrateSurveyAiDraftPayload(parsed: SurveyAiDraftPayload): {
  initial: CreateSurveyPayload;
  meta: SurveyAiDraftPayload["aiSource"];
} {
  const { aiSource, ...rest } = parsed;
  const questions = (rest.questions ?? [])
    .map((q) => rehydrateDraftQuestion(q))
    .filter((q): q is DraftQuestion => q !== null);

  return {
    initial: {
      title: rest.title ?? "",
      summary: rest.summary ?? "",
      periodStart: rest.periodStart ?? "",
      periodEnd: rest.periodEnd ?? "",
      targetCount: rest.targetCount ?? 100,
      listedPublic: rest.listedPublic ?? true,
      responseScript: rest.responseScript ?? "",
      questions,
    },
    meta: {
      ...aiSource,
      improvements: aiSource.improvements ?? [],
      additionalQuestions: aiSource.additionalQuestions ?? [],
    },
  };
}
