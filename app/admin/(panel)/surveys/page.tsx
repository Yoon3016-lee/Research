import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyDeleteButton } from "@/components/admin/SurveyDeleteButton";
import { SurveyScriptsLauncher } from "@/components/admin/SurveyScriptsLauncher";
import { SurveyTemplateImportButton } from "@/components/admin/SurveyTemplateImportButton";
import { getAdminSurveys } from "@/lib/surveys-db";
import { listSharedResponseScripts } from "@/lib/shared-scripts";
import { listSurveyResponseScriptsForAdmin } from "@/lib/survey-scripts-admin";
import { ExternalLink, Plus, Pencil, GitBranch, Sparkles, PackageOpen, Users, ListChecks } from "lucide-react";

export const metadata = { title: "설문 관리" };

export const dynamic = "force-dynamic";

export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    scripts?: string;
  }>;
}) {
  const { created, updated, deleted, scripts } = await searchParams;
  const scriptsOpen = scripts === "open" || scripts === "1";
  const [adminSurveys, sharedScripts, surveyScripts] = await Promise.all([
    getAdminSurveys(),
    listSharedResponseScripts(),
    listSurveyResponseScriptsForAdmin(),
  ]);

  return (
    <>
      <AdminHeader
        title="설문 관리"
        description="설문 작성·표본 업로드·배포(이메일·문자), 스크립트를 관리합니다."
      />
      <div className="space-y-10 p-4 sm:p-6">
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
        {deleted ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
            설문을 삭제했습니다. (slug:{" "}
            <code className="rounded bg-zinc-100 px-1">{decodeURIComponent(deleted)}</code>)
          </p>
        ) : null}

        <section aria-labelledby="surveys-list-heading">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/surveys/new"
              className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2.5"
            >
              <Plus className="h-4 w-4" aria-hidden />
              새 설문 만들기
            </Link>
            <Link
              href="/admin/surveys/ai-generate"
              className="inline-flex items-center gap-2 rounded-xl border border-accent-500/35 bg-accent-500/10 px-4 py-2.5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-accent-500/18"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              AI 설문 생성
            </Link>
            <SurveyScriptsLauncher
              sharedScripts={sharedScripts}
              surveyScripts={surveyScripts}
              defaultOpen={scriptsOpen}
            />
            <SurveyTemplateImportButton surveys={adminSurveys} mode="navigate" />
            <Link
              href="/admin/surveys/contact-defaults"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-100"
            >
              <ListChecks className="h-4 w-4" aria-hidden />
              전체 컨택 관리
            </Link>
          </div>

          <div className="admin-card mt-6 overflow-hidden">
            <div className="border-b border-brand-900/8 px-4 py-3">
              <h2 id="surveys-list-heading" className="text-sm font-semibold text-brand-900">
                설문 목록
              </h2>
              <p className="mt-0.5 text-xs text-brand-700/80">
                각 설문의 「배포 관리」에서 이메일·문자 초대 문구를 작성·발송합니다.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-brand-900/8 bg-surface/80">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-brand-800">설문</th>
                    <th className="px-4 py-3 font-semibold text-brand-800">상태</th>
                    <th className="px-4 py-3 font-semibold text-brand-800">응답</th>
                    <th className="px-4 py-3 font-semibold text-brand-800">최근 수정</th>
                    <th className="px-4 py-3 font-semibold text-brand-800">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/6">
                  {adminSurveys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-brand-700">
                        등록된 설문이 없습니다.{" "}
                        <Link href="/admin/surveys/new" className="admin-link">
                          새 설문 만들기
                        </Link>
                      </td>
                    </tr>
                  ) : null}
                  {adminSurveys.map((s) => (
                    <tr key={s.id} className="transition hover:bg-surface/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-900">{s.title}</p>
                        <p className="text-xs text-brand-700/80">ID · {s.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-900/6 px-2 py-0.5 text-xs font-medium text-brand-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-brand-800">
                        {s.responses.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-brand-700">{s.updatedAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {s.status === "진행중" ? (
                            <Link
                              href={`/survey/${s.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-accent-500/30 bg-accent-500/10 px-2.5 py-1.5 text-xs font-medium text-brand-900 hover:bg-accent-500/18"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                              참여 링크
                            </Link>
                          ) : null}
                          <Link
                            href={{
                              pathname: "/admin/surveys/samples",
                              query: { slug: s.id },
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                          >
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            표본 관리
                          </Link>
                          <Link
                            href={{
                              pathname: "/admin/surveys/distribute",
                              query: { slug: s.id },
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-100"
                          >
                            <PackageOpen className="h-3.5 w-3.5" aria-hidden />
                            배포 관리
                          </Link>
                          <Link
                            href={{
                              pathname: "/admin/surveys/logic",
                              query: { slug: s.id },
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1.5 text-xs font-medium text-fuchsia-900 hover:bg-fuchsia-100"
                          >
                            <GitBranch className="h-3.5 w-3.5" aria-hidden />
                            로직 확인
                          </Link>
                          <Link
                            href={{
                              pathname: "/admin/surveys/edit",
                              query: { slug: s.id },
                            }}
                            className="admin-btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            편집
                          </Link>
                          <SurveyDeleteButton
                            slug={s.id}
                            title={s.title}
                            responseCount={s.responses}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
