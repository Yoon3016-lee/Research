import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyAiGenerator } from "@/components/admin/SurveyAiGenerator";
import { canAccessAdminPanel } from "@/lib/roles";
import { getSiteHomepageConfig } from "@/lib/site-homepage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SurveyAiAccess } from "@/lib/survey-ai/access";

export const metadata = { title: "[ RKME MODEL ]" };

export const dynamic = "force-dynamic";

async function resolveSurveyAiMode(): Promise<SurveyAiAccess> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return "demo";
    }
    const admin = createSupabaseServiceRoleClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return canAccessAdminPanel(profile?.role ?? "guest") ? "admin" : "demo";
  } catch {
    return "demo";
  }
}

export default async function SurveyAiDemoPage() {
  const homepage = await getSiteHomepageConfig();
  const mode = await resolveSurveyAiMode();

  return (
    <>
      <AdminHeader
        title="[ RKME MODEL ]"
        description={
          mode === "admin"
            ? "KSIC·조사 목적을 입력하면 OpenAI가 설문안과 CATI 스크립트를 제안합니다."
            : "KSIC·조사 목적을 입력하면 OpenAI가 설문안과 CATI 스크립트를 제안합니다. 발표·체험용으로 로그인 없이 이용할 수 있습니다."
        }
      />
      <div className="p-4 sm:p-6">
        <p className="mb-6 text-sm text-brand-700">
          {mode === "admin" ? (
            <Link href="/admin/surveys" className="admin-link hover:underline">
              ← 설문 목록
            </Link>
          ) : (
            <Link href="/" className="admin-link hover:underline">
              ← 홈
            </Link>
          )}
        </p>
        <SurveyAiGenerator axiIconUrl={homepage.axiIconUrl} mode={mode} />
      </div>
    </>
  );
}
