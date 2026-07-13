"use server";

import { saveCatiDraft } from "@/lib/cati-drafts";
import type { CatiSaveDraftResult } from "@/lib/cati-sample-types";
import { getSurveyParticipant } from "@/lib/participant";
import { isStaffRole } from "@/lib/roles";
import type { SurveyAnswerInput } from "@/lib/survey-public";

export async function saveCatiDraftAction(
  slug: string,
  sampleId: string,
  answers: SurveyAnswerInput[],
  activeQuestionId: string | null,
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
  });
}
