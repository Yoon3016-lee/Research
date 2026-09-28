import { parseParticipationFormat } from "@/lib/survey-participation-format";
import {
  QUESTION_TYPES,
  type CreateSurveyPayload,
  type DraftQuestion,
  type QuestionType,
} from "@/lib/survey-types";

export const SURVEY_CREATE_DRAFT_KEY = "primeax-survey-create-draft-v1";

/** 요청 본문·브라우저 저장이 과도하게 커지지 않게 막는 한도 */
export const MAX_SURVEY_CREATE_DRAFT_CHARS = 1_500_000;

export type StoredSurveyCreateDraft = {
  savedAt: string;
  payload: CreateSurveyPayload;
};

const QUESTION_TYPE_SET = new Set<string>(QUESTION_TYPES);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item : ""));
}

function normalizeQuestion(raw: unknown): DraftQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Partial<DraftQuestion>;
  if (!q.type || !QUESTION_TYPE_SET.has(q.type)) return null;
  const type = q.type as QuestionType;
  const options = asStringArray(q.options);
  const clientId =
    typeof q.clientId === "string" && q.clientId.trim()
      ? q.clientId
      : `q-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    clientId,
    type,
    prompt: asString(q.prompt),
    allowSkip: Boolean(q.allowSkip),
    staffOnly: Boolean(q.staffOnly),
    visibilityRules: Array.isArray(q.visibilityRules)
      ? q.visibilityRules.filter(
          (rule) =>
            rule &&
            typeof rule === "object" &&
            Number.isInteger((rule as { sourceOrderIndex?: unknown }).sourceOrderIndex) &&
            Number.isInteger((rule as { optionIndex?: unknown }).optionIndex),
        )
      : [],
    options,
    optionIds: options.map((_, index) => {
      const id = Array.isArray(q.optionIds) ? q.optionIds[index] : null;
      return typeof id === "string" ? id : null;
    }),
    optionEndsSurvey: options.map((_, index) =>
      Boolean(Array.isArray(q.optionEndsSurvey) ? q.optionEndsSurvey[index] : false),
    ),
    otherOptionEnabled: Boolean(q.otherOptionEnabled),
    otherOptionLabel: asString(q.otherOptionLabel, "기타") || "기타",
    otherOptionId: typeof q.otherOptionId === "string" ? q.otherOptionId : null,
    maxSelections:
      typeof q.maxSelections === "number" && Number.isFinite(q.maxSelections)
        ? q.maxSelections
        : 2,
    textLineCount:
      typeof q.textLineCount === "number" && Number.isFinite(q.textLineCount)
        ? q.textLineCount
        : 2,
    infoBody: asString(q.infoBody),
    mediaUrl: typeof q.mediaUrl === "string" ? q.mediaUrl : null,
    mediaPath: typeof q.mediaPath === "string" ? q.mediaPath : null,
    mediaType: q.mediaType === "image" || q.mediaType === "video" ? q.mediaType : null,
    likertScaleLabels: asStringArray(q.likertScaleLabels),
  };
}

export function normalizeCreateDraftPayload(raw: unknown): CreateSurveyPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<CreateSurveyPayload>;
  const questions = Array.isArray(value.questions)
    ? value.questions.map(normalizeQuestion).filter((q): q is DraftQuestion => q !== null)
    : [];
  const payload: CreateSurveyPayload = {
    title: asString(value.title),
    participationFormat: parseParticipationFormat(value.participationFormat),
    summary: asString(value.summary),
    periodStart: asString(value.periodStart),
    periodEnd: asString(value.periodEnd),
    targetCount:
      typeof value.targetCount === "number" && Number.isFinite(value.targetCount)
        ? Math.max(0, Math.floor(value.targetCount))
        : 100,
    listedPublic: value.participationFormat === "email" ? false : Boolean(value.listedPublic),
    responseScript: asString(value.responseScript),
    ksicCode: asString(value.ksicCode),
    ksicName: asString(value.ksicName),
    questions,
  };
  return surveyCreateDraftHasContent(payload) ? payload : null;
}

export function surveyCreateDraftHasContent(payload: CreateSurveyPayload): boolean {
  return (
    payload.title.trim().length > 0 ||
    payload.summary.trim().length > 0 ||
    payload.responseScript.trim().length > 0 ||
    payload.questions.length > 0
  );
}

export function readSurveyCreateDraft(): StoredSurveyCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SURVEY_CREATE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSurveyCreateDraft>;
    const payload = normalizeCreateDraftPayload(parsed.payload);
    if (!payload) return null;
    return {
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      payload,
    };
  } catch {
    return null;
  }
}

export function writeSurveyCreateDraft(payload: CreateSurveyPayload): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (!surveyCreateDraftHasContent(payload)) {
      localStorage.removeItem(SURVEY_CREATE_DRAFT_KEY);
      return null;
    }
    const savedAt = new Date().toISOString();
    const stored: StoredSurveyCreateDraft = { savedAt, payload };
    const json = JSON.stringify(stored);
    if (json.length > MAX_SURVEY_CREATE_DRAFT_CHARS) return null;
    localStorage.setItem(SURVEY_CREATE_DRAFT_KEY, json);
    return savedAt;
  } catch {
    return null;
  }
}

export function clearSurveyCreateDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SURVEY_CREATE_DRAFT_KEY);
  } catch {
    /* 브라우저 저장소를 못 쓰는 경우 */
  }
}

export function newerSurveyCreateDraft(
  left: StoredSurveyCreateDraft | null,
  right: StoredSurveyCreateDraft | null,
): StoredSurveyCreateDraft | null {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left.savedAt) >= Date.parse(right.savedAt) ? left : right;
}
