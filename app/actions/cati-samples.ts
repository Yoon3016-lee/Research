"use server";

import { revalidatePath } from "next/cache";
import { applyCatiSampleUid, recordCatiSampleOutcome } from "@/lib/cati-samples";
import { resolveCatiContactOutcome } from "@/lib/cati-contact-options";
import type {
  CatiApplyResult,
  CatiContactOutcomeResult,
} from "@/lib/cati-sample-types";
import { getSurveyParticipant } from "@/lib/participant";
import { isStaffRole } from "@/lib/roles";

async function requireCatiStaff(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const participant = await getSurveyParticipant();
  if (participant.mode !== "staff" || !participant.userId) {
    return { ok: false, error: "CATI 조사는 직원 로그인 후 이용할 수 있습니다." };
  }
  if (!isStaffRole(participant.role)) {
    return { ok: false, error: "CATI 조사 권한이 없습니다." };
  }
  return { ok: true, userId: participant.userId };
}

export async function applyCatiSampleAction(
  slug: string,
  uid: string,
): Promise<CatiApplyResult> {
  const auth = await requireCatiStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const result = await applyCatiSampleUid(slug, uid);
  if (result.ok) {
    revalidatePath(`/survey/${slug}`);
  }
  return result;
}

export async function recordCatiContactOutcomeAction(
  slug: string,
  sampleId: string,
  optionId: string,
): Promise<CatiContactOutcomeResult> {
  const auth = await requireCatiStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const resolved = await resolveCatiContactOutcome(slug, optionId);
  if (!resolved) {
    return { ok: false, error: "선택한 컨택 결과를 찾을 수 없습니다." };
  }

  const result = await recordCatiSampleOutcome(slug, sampleId, resolved.label, auth.userId);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/survey/${slug}`);
  revalidatePath("/admin/surveys/samples");

  return { ok: true, outcome: resolved.label, isSuccess: resolved.isSuccess };
}
