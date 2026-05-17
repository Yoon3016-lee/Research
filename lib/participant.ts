import "server-only";

import { isStaffRole, ROLE_LABELS, type StaffRole } from "@/lib/roles";
import type { SurveyParticipant } from "@/lib/participant-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { SurveyParticipant } from "@/lib/participant-types";

export type RespondentInsert = {
  respondent_user_id: string | null;
  respondent_kind: "staff" | "guest";
};

export async function getSurveyParticipant(): Promise<SurveyParticipant> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mode: "anonymous" };
  }

  const email = user.email ?? "(이메일 없음)";

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { mode: "guest_account", userId: user.id, email };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "guest") as StaffRole;
  const displayEmail = profile?.email ?? email;

  if (isStaffRole(role)) {
    return {
      mode: "staff",
      userId: user.id,
      email: displayEmail,
      role,
      roleLabel: ROLE_LABELS[role],
    };
  }

  return {
    mode: "guest_account",
    userId: user.id,
    email: displayEmail,
  };
}

export async function resolveRespondentForInsert(): Promise<RespondentInsert> {
  const participant = await getSurveyParticipant();

  if (participant.mode === "anonymous") {
    return { respondent_user_id: null, respondent_kind: "guest" };
  }

  if (participant.mode === "staff") {
    return {
      respondent_user_id: participant.userId,
      respondent_kind: "staff",
    };
  }

  return {
    respondent_user_id: participant.userId,
    respondent_kind: "guest",
  };
}
