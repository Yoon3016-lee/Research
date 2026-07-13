import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveySampleUploadPanel } from "@/components/admin/SurveySampleUploadPanel";
import { listSurveySampleBatches } from "@/lib/survey-samples-admin";
import { loadSurveyForEdit } from "@/lib/surveys-admin";

export const metadata = { title: "표본 관리" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ slug?: string; uploaded?: string }>;
};

export default async function SurveySamplesPage({ searchParams }: Props) {
  const { slug: slugParam, uploaded } = await searchParams;
  const slug = slugParam?.trim();

  if (!slug) {
    return (
      <>
        <AdminHeader
          title="표본 관리"
          description="CATI 조사 대상 표본 엑셀을 업로드·버전 관리합니다."
        />
        <div className="p-4 sm:p-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            설문 slug가 없습니다.{" "}
            <Link href="/admin/surveys" className="admin-link hover:underline">
              설문 목록
            </Link>
            에서 「표본 관리」를 선택하세요.
          </p>
        </div>
      </>
    );
  }

  const [loaded, { batches }] = await Promise.all([
    loadSurveyForEdit(slug),
    listSurveySampleBatches(slug),
  ]);

  if (!loaded.ok) {
    if (loaded.reason === "not_configured") {
      return (
        <>
          <AdminHeader title="표본 관리" />
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
        title="표본 관리"
        description="조사 대상 UID·전화번호가 담긴 엑셀을 업로드합니다. 버전별로 보존되며 최신 업로드가 자동 적용됩니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        {uploaded ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            표본이 업로드되었습니다.
          </p>
        ) : null}

        <p className="flex flex-wrap items-center gap-4 text-sm text-brand-700">
          <Link href="/admin/surveys" className="admin-link hover:underline">
            ← 설문 목록
          </Link>
          <Link
            href={{ pathname: "/admin/surveys/edit", query: { slug } }}
            className="admin-link hover:underline"
          >
            설문 편집
          </Link>
          <Link
            href={{ pathname: "/admin/surveys/distribute", query: { slug } }}
            className="text-sky-800 hover:underline"
          >
            배포 관리
          </Link>
        </p>

        <SurveySampleUploadPanel slug={slug} title={title} batches={batches} />
      </div>
    </>
  );
}
