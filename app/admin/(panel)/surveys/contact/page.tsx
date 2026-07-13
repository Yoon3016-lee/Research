import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CatiContactOptionsPanel } from "@/components/admin/CatiContactOptionsPanel";
import { listCatiContactOptions } from "@/lib/cati-contact-options";
import { loadSurveyForEdit } from "@/lib/surveys-admin";

export const metadata = { title: "컨택 관리" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function SurveyContactPage({ searchParams }: Props) {
  const { slug: slugParam } = await searchParams;
  const slug = slugParam?.trim();

  if (!slug) {
    return (
      <>
        <AdminHeader
          title="컨택 관리"
          description="CATI 조사원이 선택하는 컨택 결과 항목을 설문별로 편집합니다."
        />
        <div className="p-4 sm:p-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            설문 slug가 없습니다.{" "}
            <Link href="/admin/surveys" className="admin-link hover:underline">
              설문 목록
            </Link>
            에서 「컨택 관리」를 선택하세요.
          </p>
        </div>
      </>
    );
  }

  const [loaded, contact] = await Promise.all([
    loadSurveyForEdit(slug),
    listCatiContactOptions(slug),
  ]);

  if (!loaded.ok) {
    if (loaded.reason === "not_configured") {
      return (
        <>
          <AdminHeader title="컨택 관리" />
          <div className="p-4 sm:p-6">
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              서버에 <code className="rounded bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>가
              설정되어 있지 않습니다.
            </p>
          </div>
        </>
      );
    }
    notFound();
  }

  const { title } = loaded.bundle;

  return (
    <>
      <AdminHeader
        title="컨택 관리"
        description="조사원이 UID 확인 후 선택하는 컨택 결과 선택지를 편집합니다. 「성공」 항목 선택 시 설문 문항으로 진행합니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <p className="flex flex-wrap items-center gap-4 text-sm text-brand-700">
          <Link href="/admin/surveys" className="admin-link hover:underline">
            ← 설문 목록
          </Link>
          <Link
            href={{ pathname: "/admin/surveys/samples", query: { slug } }}
            className="text-emerald-800 hover:underline"
          >
            표본 관리
          </Link>
          <Link
            href={{ pathname: "/admin/surveys/edit", query: { slug } }}
            className="admin-link hover:underline"
          >
            설문 편집
          </Link>
        </p>

        <CatiContactOptionsPanel
          slug={slug}
          title={title}
          initialOptions={contact.options}
          usingDefaults={contact.usingDefaults}
        />
      </div>
    </>
  );
}
