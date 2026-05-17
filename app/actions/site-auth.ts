"use server";

import { revalidatePath } from "next/cache";
import type { StaffRole } from "@/lib/roles";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SiteAuthResult = {
  error?: string;
  redirectTo?: string;
};

function safeReturnPath(next: string | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.startsWith("/admin")) return fallback;
  return next;
}

function resolveReturnPath(formData: FormData): string {
  const slug = String(formData.get("slug") ?? "").trim();
  const fallback = slug ? `/survey/${slug}` : "/";
  return safeReturnPath(String(formData.get("next") ?? ""), fallback);
}

export async function surveyLoginAction(formData: FormData): Promise<SiteAuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = resolveReturnPath(formData);

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력하세요." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : error.message,
    };
  }

  revalidatePath(next);
  revalidatePath("/", "layout");
  return { redirectTo: next };
}

export async function guestSignupAction(formData: FormData): Promise<SiteAuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const next = resolveReturnPath(formData);

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력하세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (password !== password2) {
    return { error: "비밀번호 확인이 일치하지 않습니다." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "서버 설정이 완료되지 않았습니다." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: signData, error: signError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signError) {
    if (signError.message.includes("already registered")) {
      return { error: "이미 등록된 이메일입니다. 로그인해 주세요." };
    }
    return { error: signError.message };
  }

  const user = signData.user;
  if (!user) {
    return {
      error:
        "가입 요청이 접수되었습니다. 이메일 인증이 필요하면 메일을 확인한 뒤 로그인하세요.",
    };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: profileError } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      role: "guest" satisfies StaffRole,
    });
    if (profileError) {
      return { error: `프로필 생성 오류: ${profileError.message}` };
    }
  }

  revalidatePath(next);
  revalidatePath("/", "layout");

  if (!signData.session) {
    return { redirectTo: `${next}?notice=confirm-email` };
  }
  return { redirectTo: next };
}

export async function surveyLogoutAction(
  formData: FormData,
): Promise<{ redirectTo: string }> {
  const next = resolveReturnPath(formData);

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath(next);
  revalidatePath("/", "layout");
  return { redirectTo: next };
}
