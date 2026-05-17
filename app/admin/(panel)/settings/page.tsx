import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SignupKeyForm } from "@/components/admin/SignupKeyForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "가입키 설정" };

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return (
      <>
        <AdminHeader
          title="가입키 설정"
          description="이 페이지는 총관리자만 이용할 수 있습니다."
        />
        <div className="p-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            권한이 없습니다. 총관리자에게 문의하세요.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="관리자 가입키"
        description="새 가입키를 저장하면 이후 회원가입 시 새 키가 필요합니다. 서버·DB에만 저장됩니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <SignupKeyForm />
      </div>
    </>
  );
}
