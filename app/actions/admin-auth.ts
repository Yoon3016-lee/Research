"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAccessAdminPanel, type StaffRole } from "@/lib/roles";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/admin";
  if (next.startsWith("/survey/") || next.startsWith("/admin")) return next;
  return "/admin";
}

export type AuthActionState = {
  error?: string;
  ok?: boolean;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "");
  const next = safeNextPath(nextRaw || null);

  if (!email || !password) {
    return { error: "아이디(이메일)와 비밀번호를 입력하세요." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message === "Invalid login credentials"
      ? "이메일 또는 비밀번호가 올바르지 않습니다."
      : error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인 세션을 확인할 수 없습니다." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await supabase.auth.signOut();
    return { error: "서버 설정이 완료되지 않았습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessAdminPanel(profile?.role)) {
    await supabase.auth.signOut();
    return {
      error:
        "관리자 페이지는 총관리자·서브관리자만 이용할 수 있습니다. 직원·게스트 계정은 공개 설문 사이트를 이용해 주세요.",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const signupKey = String(formData.get("signup_key") ?? "").trim();
  const nextRaw = String(formData.get("next") ?? "");
  const next = safeNextPath(nextRaw || null);

  if (!email || !password) {
    return { error: "아이디(이메일)와 비밀번호를 입력하세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (password !== password2) {
    return { error: "비밀번호 확인이 일치하지 않습니다." };
  }
  if (!signupKey) {
    return { error: "관리자 가입키를 입력하세요." };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { error: "서버에 Supabase 설정이 없습니다. .env.local을 확인하세요." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: settings, error: settingsError } = await admin
    .from("admin_settings")
    .select("signup_key")
    .eq("id", 1)
    .maybeSingle();

  if (settingsError || !settings?.signup_key) {
    return { error: "가입키를 확인할 수 없습니다. DB 마이그레이션을 적용했는지 확인하세요." };
  }
  if (settings.signup_key !== signupKey) {
    return { error: "관리자 가입키가 올바르지 않습니다." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: signData, error: signError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signError) {
    if (signError.message.includes("already registered")) {
      return { error: "이미 등록된 이메일입니다." };
    }
    return { error: signError.message };
  }

  const user = signData.user;
  if (!user) {
    return {
      error:
        "가입 요청은 접수되었습니다. 이메일 인증이 켜져 있으면 메일을 확인한 뒤 로그인하세요.",
    };
  }

  const hasSession = !!signData.session;

  const { count, error: countError } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return { error: "프로필을 생성할 수 없습니다. 관리자에게 문의하세요." };
  }

  const role: StaffRole =
    count === 0 ? "super_admin" : "employee";

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    email: user.email,
    role,
  });

  if (profileError) {
    return { error: `프로필 저장 오류: ${profileError.message}` };
  }

  revalidatePath("/", "layout");

  const adminDestination = canAccessAdminPanel(role)
    ? next
    : "/admin/unauthorized";

  if (!hasSession) {
    const loginNext = next.startsWith("/survey/")
      ? `/admin/login?notice=confirm-email&next=${encodeURIComponent(next)}`
      : "/admin/login?notice=confirm-email";
    redirect(loginNext);
  }
  redirect(adminDestination);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}

export async function updateSignupKeyAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const newKey = String(formData.get("signup_key") ?? "").trim();
  const confirm = String(formData.get("signup_key_confirm") ?? "").trim();

  if (!newKey || newKey.length < 4) {
    return { error: "가입키는 4자 이상으로 설정하세요." };
  }
  if (newKey !== confirm) {
    return { error: "가입키 확인이 일치하지 않습니다." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return { error: "총관리자만 가입키를 변경할 수 있습니다." };
  }

  const { error } = await admin
    .from("admin_settings")
    .update({
      signup_key: newKey,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}
