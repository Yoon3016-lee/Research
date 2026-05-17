import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSurveys } from "@/lib/surveys-db";
import { ExternalLink, Plus, Pencil } from "lucide-react";

export const metadata = { title: "설문 관리" };

export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const { created, updated } = await searchParams;
  const adminSurveys = await getAdminSurveys();

  return (
    <>
      <AdminHeader
        title="설문 관리"
        description="Supabase `surveys` 테이블과 연동됩니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        {created ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            설문이 저장되었습니다. (slug:{" "}
            <code className="rounded bg-emerald-100/80 px-1">{decodeURIComponent(created)}</code>)
          </p>
        ) : null}
        {updated ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            설문이 수정되었습니다. (slug:{" "}
            <code className="rounded bg-emerald-100/80 px-1">{decodeURIComponent(updated)}</code>)
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/surveys/new"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            새 설문 만들기
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            템플릿 불러오기
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-700">설문</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">상태</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">응답</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">최근 수정</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {adminSurveys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">
                      등록된 설문이 없습니다.{" "}
                      <Link href="/admin/surveys/new" className="font-medium text-indigo-700">
                        새 설문 만들기
                      </Link>
                    </td>
                  </tr>
                ) : null}
                {adminSurveys.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{s.title}</p>
                      <p className="text-xs text-zinc-500">ID · {s.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700">
                      {s.responses.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{s.updatedAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {s.status === "진행중" ? (
                          <Link
                            href={`/survey/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            참여 링크
                          </Link>
                        ) : null}
                        <Link
                          href={{
                            pathname: "/admin/surveys/edit",
                            query: { slug: s.id },
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          편집
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
