"use server";

import { getCatiDraft, saveCatiDraft } from "@/lib/cati-drafts";
import type { CatiSaveDraftResult } from "@/lib/cati-sample-types";
import { getSurveyParticipant } from "@/lib/participant";
import { isStaffRole } from "@/lib/roles";
import type { SurveyAnswerInput } from "@/lib/survey-public";

export async function saveCatiDraftAction(
  slug: string,
  sampleId: string,
  answers: SurveyAnswerInput[],
  activeQuestionId: string | null,
  startedAt?: string | null,
  activeSeconds?: number | null,
): Promise<CatiSaveDraftResult> {
  const participant = await getSurveyParticipant();
  if (participant.mode !== "staff" || !participant.userId) {
    return { ok: false, error: "CATI 조사는 직원 로그인 후 이용할 수 있습니다." };
  }
  if (!isStaffRole(participant.role)) {
    return { ok: false, error: "CATI 조사 권한이 없습니다." };
  }

  return saveCatiDraft({
    surveyRef: slug,
    sampleId,
    answers,
    activeQuestionId,
    updatedBy: participant.userId,
    startedAt,
    activeSeconds,
  });
}

/** 설문 진입 시 시작 시각만 초안에 남김 (중도 중단 전에도 소요 시간 유지) */
export async function rememberCatiStartedAtAction(
  slug: string,
  sampleId: string,
  startedAt: string,
  activeSeconds?: number,
): Promise<CatiSaveDraftResult> {
  const participant = await getSurveyParticipant();
  if (participant.mode !== "staff" || !participant.userId) {
    return { ok: false, error: "CATI 조사는 직원 로그인 후 이용할 수 있습니다." };
  }
  if (!isStaffRole(participant.role)) {
    return { ok: false, error: "CATI 조사 권한이 없습니다." };
  }

  const existing = await getCatiDraft(sampleId);
  return saveCatiDraft({
    surveyRef: slug,
    sampleId,
    answers: existing?.answers ?? [],
    activeQuestionId: existing?.activeQuestionId ?? null,
    updatedBy: participant.userId,
    startedAt,
    activeSeconds,
  });
}
