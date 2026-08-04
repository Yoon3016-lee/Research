import type { DraftQuestion } from "@/lib/survey-types";

function newClientId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `q-${Date.now()}-${Math.random()}`;
}

/** 다른 설문에서 복사할 때 새 clientId 부여 (저장 시 신규 문항으로 처리) */
export function cloneQuestionsAsTemplate(questions: DraftQuestion[]): DraftQuestion[] {
  return questions.map((q) => ({
    ...q,
    clientId: newClientId(),
    options: [...q.options],
    optionIds: q.options.map(() => null),
    optionEndsSurvey: [...(q.optionEndsSurvey ?? q.options.map(() => false))],
    otherOptionEnabled: q.otherOptionEnabled ?? false,
    otherOptionLabel: q.otherOptionLabel?.trim() || "기타",
    otherOptionId: null,
    infoBody: q.infoBody ?? "",
    mediaUrl: q.mediaUrl ?? null,
    mediaPath: q.mediaPath ?? null,
    mediaType: q.mediaType ?? null,
  }));
}
