"use server";

import { askAxiGuide, type AxiAskMode } from "@/lib/axi/ask";
import { canUseAxi } from "@/lib/axi/access";
import { getSurveyParticipant } from "@/lib/participant";
import { getSiteHomepageConfig } from "@/lib/site-homepage";

export type AskAxiActionResult =
  | { ok: true; answer: string }
  | { ok: false; error: string };

export async function askAxiAction(input: {
  question: string;
  mode?: AxiAskMode;
  surveyTitle: string;
  scriptContext: string;
  ksicCode?: string;
  ksicName?: string;
}): Promise<AskAxiActionResult> {
  const [participant, homepage] = await Promise.all([
    getSurveyParticipant(),
    getSiteHomepageConfig(),
  ]);

  if (!canUseAxi(participant, homepage.axiAllowedRoles)) {
    return { ok: false, error: "AXI를 사용할 권한이 없습니다." };
  }

  const mode: AxiAskMode = input.mode === "survey" ? "survey" : "general";

  return askAxiGuide({
    question: input.question ?? "",
    mode,
    surveyTitle: input.surveyTitle ?? "",
    scriptContext: input.scriptContext ?? "",
    ksicCode: input.ksicCode ?? "",
    ksicName: input.ksicName ?? "",
  });
}
