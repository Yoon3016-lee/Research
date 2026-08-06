import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyBuilderForm } from "@/components/admin/SurveyBuilderForm";
import { loadSurveyForEdit } from "@/lib/surveys-admin";
import { getAdminSurveys } from "@/lib/surveys-db";

export const metadata = { title: "설문 편집" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function EditSurveyByQueryPage({ searchParams }: Props) {
  const { slug: slugParam } = await searchParams;
  const slug = slugParam?.trim();

  if (!slug) {
    return (
      <>
        <AdminHeader title="설문 편집" description="편집할 설문을 지정하지 않았습니다." />
        <div className="p-4 sm:p-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            설문 slug가 없습니다.{" "}
            <Link href="/admin/surveys" className="font-medium text-indigo-700 hover:underline">
              설문 목록
            </Link>
            에서 편집할 설문을 선택하세요.
          </p>
        </div>
      </>
    );
  }

  const [loaded, adminSurveys] = await Promise.all([
    loadSurveyForEdit(slug),
    getAdminSurveys(),
  ]);

  if (!loaded.ok) {
    if (loaded.reason === "not_configured") {
      return (
        <>
          <AdminHeader title="설문 편집" />
          <div className="p-4 sm:p-6">
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              서버에 <code className="rounded bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>가
              설정되어 있지 않습니다. <code>.env.local</code>을 확인한 뒤 개발 서버를 다시
              시작하세요.
            </p>
          </div>
        </>
      );
    }
    notFound();
  }

  const { slug: surveySlug, responseCount, status, successorSlug, supersedesSlug, ...initial } =
    loaded.bundle;

  return (
    <>
      <AdminHeader
        title="설문 편집"
        description={
          responseCount > 0
            ? "응답이 있는 설문은 저장 시 새 버전이 생성되고 기존 설문은 종료됩니다."
            : "기본 정보와 문항을 수정한 뒤 저장합니다."
        }
      />
      <div className="p-4 sm:p-6">
        <p className="mb-6 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
          <Link href="/admin/surveys" className="font-medium text-indigo-700 hover:underline">
            ← 설문 목록
          </Link>
          <Link
            href={{
              pathname: "/admin/surveys/logic",
              query: { slug: surveySlug },
            }}
            className="font-medium text-fuchsia-800 hover:underline"
          >
            로직 확인
          </Link>
        </p>
        <SurveyBuilderForm
          mode="edit"
          slug={surveySlug}
          initial={initial}
          responseCount={responseCount}
          surveyStatus={status}
          successorSlug={successorSlug}
          supersedesSlug={supersedesSlug}
          templateSurveys={adminSurveys}
        />
      </div>
    </>
  );
}
