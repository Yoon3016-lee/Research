"use server";

import { revalidatePath } from "next/cache";
import { getSurveyParticipant } from "@/lib/participant";
import { setSurveyViewModeForUser } from "@/lib/user-preferences";
import { isSurveyViewMode, type SurveyViewMode } from "@/lib/survey-view-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserSettingsResult = { ok: true } | { ok: false; error: string };

export async function updateSurveyViewModeAction(
  mode: SurveyViewMode,
): Promise<UserSettingsResult> {
  if (!isSurveyViewMode(mode)) {
    return { ok: false, error: "알 수 없는 진행 방식입니다." };
  }

  const participant = await getSurveyParticipant();
  if (participant.mode === "anonymous" || !participant.userId) {
    return { ok: false, error: "로그인 후 이용할 수 있습니다." };
  }

  const result = await setSurveyViewModeForUser(participant.userId, mode);
  if (result.ok) {
    revalidatePath("/mypage");
    revalidatePath("/", "layout");
  }
  return result;
}

export async function changePasswordAction(
  formData: FormData,
): Promise<UserSettingsResult> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const newPassword2 = String(formData.get("new_password2") ?? "");

  if (!currentPassword || !newPassword) {
    return { ok: false, error: "현재 비밀번호와 새 비밀번호를 입력하세요." };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "새 비밀번호는 8자 이상이어야 합니다." };
  }
  if (newPassword !== newPassword2) {
    return { ok: false, error: "새 비밀번호 확인이 일치하지 않습니다." };
  }
  if (newPassword === currentPassword) {
    return { ok: false, error: "새 비밀번호가 현재 비밀번호와 동일합니다." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "로그인 후 이용할 수 있습니다." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}
