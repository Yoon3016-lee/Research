"use server";

import { askAxiGuide } from "@/lib/axi/ask";
import { canViewResponseScript } from "@/lib/roles";
import { getSurveyParticipant } from "@/lib/participant";

export type AskAxiActionResult =
  | { ok: true; answer: string }
  | { ok: false; error: string };

export async function askAxiAction(input: {
  question: string;
  surveyTitle: string;
  scriptContext: string;
  ksicCode?: string;
  ksicName?: string;
}): Promise<AskAxiActionResult> {
  const participant = await getSurveyParticipant();
  if (participant.mode !== "staff" || !canViewResponseScript(participant.role)) {
    return { ok: false, error: "AXI는 직원 로그인 후 이용할 수 있습니다." };
  }

  return askAxiGuide({
    question: input.question ?? "",
    surveyTitle: input.surveyTitle ?? "",
    scriptContext: input.scriptContext ?? "",
    ksicCode: input.ksicCode ?? "",
    ksicName: input.ksicName ?? "",
  });
}
