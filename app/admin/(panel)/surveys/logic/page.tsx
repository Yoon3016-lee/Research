import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyLogicViewer } from "@/components/admin/SurveyLogicViewer";
import { buildSurveyLogicModel } from "@/lib/survey-logic-view";
import { loadSurveyForEdit } from "@/lib/surveys-admin";

export const metadata = { title: "로직 확인" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function SurveyLogicPage({ searchParams }: Props) {
  const { slug: slugParam } = await searchParams;
  const slug = slugParam?.trim();

  if (!slug) {
    return (
      <>
        <AdminHeader
          title="로직 확인"
          description="설문의 직원 전용·조건부 표시 규칙을 한눈에 봅니다."
        />
        <div className="p-4 sm:p-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            설문 slug가 없습니다.{" "}
            <Link href="/admin/surveys" className="font-medium text-indigo-700 hover:underline">
              설문 목록
            </Link>
            에서 「로직 확인」을 선택하세요.
          </p>
        </div>
      </>
    );
  }

  const loaded = await loadSurveyForEdit(slug);

  if (!loaded.ok) {
    if (loaded.reason === "not_configured") {
      return (
        <>
          <AdminHeader title="로직 확인" />
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

  const { title, questions } = loaded.bundle;
  const model = buildSurveyLogicModel(questions);

  return (
    <>
      <AdminHeader
        title="로직 확인"
        description="직원 전용·조건부 문항이 설문 흐름도로 표시됩니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-600">
              <Link href="/admin/surveys" className="font-medium text-indigo-700 hover:underline">
                ← 설문 목록
              </Link>
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">{title}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              slug · <code className="rounded bg-zinc-100 px-1">{loaded.bundle.slug}</code>
            </p>
          </div>
          <Link
            href={{
              pathname: "/admin/surveys/edit",
              query: { slug: loaded.bundle.slug },
            }}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            설문 편집
          </Link>
        </div>

        <SurveyLogicViewer model={model} />
      </div>
    </>
  );
}
