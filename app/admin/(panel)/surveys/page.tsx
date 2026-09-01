import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSurveyStatusBadge } from "@/components/admin/AdminSurveyIconActions";
import { SurveyDeleteButton } from "@/components/admin/SurveyDeleteButton";
import { SurveyScriptsLauncher } from "@/components/admin/SurveyScriptsLauncher";
import { SurveyTemplateImportButton } from "@/components/admin/SurveyTemplateImportButton";
import type { SurveyStatus } from "@/lib/survey-list-types";
import { getAdminSurveys } from "@/lib/surveys-db";
import { listSharedResponseScripts } from "@/lib/shared-scripts";
import { listSurveyResponseScriptsForAdmin } from "@/lib/survey-scripts-admin";
import { ExternalLink, Plus, Pencil, GitBranch, Sparkles, PackageOpen, Users, ListChecks } from "lucide-react";

export const metadata = { title: "설문 관리" };

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "진행중", label: "진행중" },
  { value: "예정", label: "예정" },
  { value: "종료", label: "종료" },
  { value: "all", label: "전체" },
] as const;

type StatusFilterValue = SurveyStatus | "all";

function parseStatusFilter(raw: string | undefined): StatusFilterValue {
  if (raw === "진행중" || raw === "예정" || raw === "종료") return raw;
  return "all";
}

function parsePage(raw: string | undefined, totalPages: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(totalPages, Math.floor(n));
}

function surveysListHref(opts: {
  status?: StatusFilterValue;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (opts.status && opts.status !== "all") {
    params.set("status", opts.status);
  }
  if (opts.page && opts.page > 1) {
    params.set("page", String(opts.page));
  }
  const q = params.toString();
  return q ? `/admin/surveys?${q}` : "/admin/surveys";
}

export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    forked?: string;
    from?: string;
    deleted?: string;
    scripts?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const {
    created,
    updated,
    forked,
    from,
    deleted,
    scripts,
    status: statusParam,
    page: pageParam,
  } = await searchParams;
  const scriptsOpen = scripts === "open" || scripts === "1";
  const statusFilter = parseStatusFilter(statusParam);
  const [adminSurveys, sharedScripts, surveyScripts] = await Promise.all([
    getAdminSurveys(),
    listSharedResponseScripts(),
    listSurveyResponseScriptsForAdmin(),
  ]);
  const filteredSurveys =
    statusFilter === "all"
      ? adminSurveys
      : adminSurveys.filter((s) => s.status === statusFilter);

  const totalCount = filteredSurveys.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = parsePage(pageParam, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedSurveys = filteredSurveys.slice(pageStart, pageStart + PAGE_SIZE);
  const showPagination = totalCount > PAGE_SIZE;

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
        {forked ? (
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            응답이 있는 설문을 새 버전으로 저장했습니다. 새 slug:{" "}
            <code className="rounded bg-sky-100/80 px-1">{decodeURIComponent(forked)}</code>
            {from ? (
              <>
                {" "}
                (이전 버전{" "}
                <code className="rounded bg-sky-100/80 px-1">{decodeURIComponent(from)}</code>는
                종료·비공개로 보존됩니다)
              </>
            ) : null}
            . 배포 링크는 새 slug로 업데이트하세요.
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
              RKME 설문 생성
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
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-900/8 px-4 py-3">
              <div className="min-w-0 flex-1">
                <h2 id="surveys-list-heading" className="text-sm font-semibold text-brand-900">
                  설문 목록
                </h2>
                <p className="mt-0.5 text-xs text-brand-700/80">
                  각 설문의 「배포 관리」에서 이메일·문자 초대 문구를 작성·발송합니다.
                </p>
              </div>
              <fieldset className="shrink-0">
                <legend className="sr-only">설문 상태 필터</legend>
                <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="설문 상태">
                  {STATUS_FILTERS.map((opt) => {
                    const selected = statusFilter === opt.value;
                    const href = surveysListHref({ status: opt.value });
                    return (
                      <Link
                        key={opt.value}
                        href={href}
                        role="radio"
                        aria-checked={selected}
                        className={
                          selected
                            ? "rounded-lg border border-brand-900/20 bg-brand-900 px-2.5 py-1 text-xs font-semibold text-white"
                            : "rounded-lg border border-brand-900/12 bg-white px-2.5 py-1 text-xs font-medium text-brand-800 hover:bg-surface"
                        }
                      >
                        {opt.label}
                      </Link>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-brand-900/8 bg-surface/80">
                  <tr>
                    <th className="w-[26%] max-w-[13rem] px-4 py-3 font-semibold text-brand-800">
                      설문
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-semibold text-brand-800 sm:px-8">
                      상태
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-semibold text-brand-800 sm:px-8">
                      응답
                    </th>
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
                  {adminSurveys.length > 0 && filteredSurveys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-brand-700">
                        선택한 상태의 설문이 없습니다.{" "}
                        <Link href="/admin/surveys" className="admin-link">
                          전체 보기
                        </Link>
                      </td>
                    </tr>
                  ) : null}
                  {pagedSurveys.map((s) => (
                    <tr key={s.id} className="transition hover:bg-surface/60">
                      <td className="max-w-[13rem] px-4 py-3 align-middle sm:max-w-[16rem]">
                        <p
                          className="truncate text-sm font-medium text-brand-900"
                          title={s.title}
                        >
                          {s.title}
                        </p>
                        <p className="mt-0.5 truncate text-[0.6875rem] text-brand-700/80" title={s.id}>
                          ID · {s.id}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 align-middle sm:px-8">
                        <AdminSurveyStatusBadge status={s.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 align-middle tabular-nums text-brand-800 sm:px-8">
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
            {showPagination ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-900/8 px-4 py-3">
                <p className="text-xs text-brand-700/80">
                  전체 {totalCount.toLocaleString()}건 · {currentPage}/{totalPages}페이지
                  (페이지당 {PAGE_SIZE}건)
                </p>
                <nav className="flex flex-wrap items-center gap-1" aria-label="설문 목록 페이지">
                  <Link
                    href={surveysListHref({
                      status: statusFilter,
                      page: Math.max(1, currentPage - 1),
                    })}
                    aria-disabled={currentPage <= 1}
                    className={
                      currentPage <= 1
                        ? "pointer-events-none rounded-lg border border-brand-900/8 px-2.5 py-1 text-xs text-brand-700/40"
                        : "rounded-lg border border-brand-900/12 bg-white px-2.5 py-1 text-xs font-medium text-brand-800 hover:bg-surface"
                    }
                  >
                    이전
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const selected = page === currentPage;
                    return (
                      <Link
                        key={page}
                        href={surveysListHref({ status: statusFilter, page })}
                        aria-current={selected ? "page" : undefined}
                        className={
                          selected
                            ? "rounded-lg border border-brand-900/20 bg-brand-900 px-2.5 py-1 text-xs font-semibold text-white"
                            : "rounded-lg border border-brand-900/12 bg-white px-2.5 py-1 text-xs font-medium text-brand-800 hover:bg-surface"
                        }
                      >
                        {page}
                      </Link>
                    );
                  })}
                  <Link
                    href={surveysListHref({
                      status: statusFilter,
                      page: Math.min(totalPages, currentPage + 1),
                    })}
                    aria-disabled={currentPage >= totalPages}
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none rounded-lg border border-brand-900/8 px-2.5 py-1 text-xs text-brand-700/40"
                        : "rounded-lg border border-brand-900/12 bg-white px-2.5 py-1 text-xs font-medium text-brand-800 hover:bg-surface"
                    }
                  >
                    다음
                  </Link>
                </nav>
              </div>
            ) : totalCount > 0 ? (
              <div className="border-t border-brand-900/8 px-4 py-3">
                <p className="text-xs text-brand-700/80">
                  전체 {totalCount.toLocaleString()}건
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
