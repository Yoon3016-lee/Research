import {
  createDraftQuestion,
  QUESTION_TYPES,
  type CreateSurveyPayload,
  type DraftQuestion,
  type QuestionType,
} from "@/lib/survey-types";
import { clampLikertScaleSize, normalizeLikertScaleLabels } from "@/lib/likert-scale";
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
    optionIds: Array.isArray(raw.optionIds)
      ? (raw.options ?? base.options).map((_, i) =>
          typeof raw.optionIds?.[i] === "string" ? raw.optionIds[i] : null,
        )
      : (Array.isArray(raw.options) ? raw.options : base.options).map(() => null),
    optionEndsSurvey: Array.isArray(raw.optionEndsSurvey)
      ? (raw.options ?? base.options).map((_, i) => Boolean(raw.optionEndsSurvey?.[i]))
      : Array.isArray(raw.options)
        ? raw.options.map((o) =>
            typeof o === "string" ? /조사\s*종료/.test(o) : false,
          )
        : base.optionEndsSurvey,
    otherOptionEnabled: Boolean(raw.otherOptionEnabled),
    otherOptionLabel:
      typeof raw.otherOptionLabel === "string" && raw.otherOptionLabel.trim()
        ? raw.otherOptionLabel.trim()
        : base.otherOptionLabel,
    otherOptionId:
      typeof raw.otherOptionId === "string" && raw.otherOptionId.trim()
        ? raw.otherOptionId.trim()
        : null,
    infoBody: typeof raw.infoBody === "string" ? raw.infoBody : base.infoBody,
    mediaUrl: typeof raw.mediaUrl === "string" ? raw.mediaUrl : (raw.mediaUrl ?? base.mediaUrl),
    mediaPath:
      typeof raw.mediaPath === "string" ? raw.mediaPath : (raw.mediaPath ?? base.mediaPath),
    mediaType:
      raw.mediaType === "image" || raw.mediaType === "video" ? raw.mediaType : base.mediaType,
    maxSelections:
      typeof raw.maxSelections === "number" && Number.isFinite(raw.maxSelections)
        ? raw.maxSelections
        : base.maxSelections,
    likertScaleLabels: Array.isArray(raw.likertScaleLabels)
      ? normalizeLikertScaleLabels(
          raw.likertScaleLabels.map((l) => String(l)),
          clampLikertScaleSize(
            typeof raw.maxSelections === "number" ? raw.maxSelections : base.maxSelections,
          ),
        )
      : base.likertScaleLabels,
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
      participationFormat: rest.participationFormat === "email" ? "email" : "site",
      listedPublic: rest.listedPublic ?? true,
      responseScript: rest.responseScript ?? "",
      ksicCode: typeof rest.ksicCode === "string" ? rest.ksicCode : "",
      ksicName: typeof rest.ksicName === "string" ? rest.ksicName : "",
      questions,
    },
    meta: {
      ...aiSource,
      improvements: aiSource.improvements ?? [],
      additionalQuestions: aiSource.additionalQuestions ?? [],
    },
  };
}
