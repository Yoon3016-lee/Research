"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSurveyResponseAction } from "@/app/actions/delete-survey-response";
import type { SurveyResponseEntry, SurveyResponseList } from "@/lib/survey-response-list";
import type { StaffWorkloadRow } from "@/lib/survey-workload";

type Props = {
  slug: string;
  list: SurveyResponseList;
  staff: StaffWorkloadRow[];
  entryFilter: string;
};

function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function entryLabel(entry: SurveyResponseEntry): string {
  if (entry.kind === "staff") {
    return entry.email || "직원 (계정 정보 없음)";
  }
  if (entry.email) return `${entry.email} (게스트)`;
  return "비로그인";
}

function DeleteResponseButton({
  slug,
  entry,
}: {
  slug: string;
  entry: SurveyResponseEntry;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const who = entryLabel(entry);
        const when = formatSubmittedAt(entry.submittedAt);
        const ok = window.confirm(
          `${when}에 ${who}가 입력한 응답을 삭제할까요?\n\n진행도와 응답 분석에서 빠지며, 되돌릴 수 없습니다.`,
        );
        if (!ok) return;
        startTransition(async () => {
          const result = await deleteSurveyResponseAction({ slug, responseId: entry.id });
          if (!result.ok) {
            window.alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}

function progressHref(slug: string, page: number, entryFilter: string): string {
  const params = new URLSearchParams({ survey: slug });
  if (entryFilter && entryFilter !== "all") params.set("entry", entryFilter);
  if (page > 1) params.set("page", String(page));
  return `/admin/progress?${params.toString()}`;
}

export function SurveyResponseManageList({ slug, list, staff, entryFilter }: Props) {
  const pageCount = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">응답 데이터</h2>
          <p className="mt-1 text-sm text-zinc-600">
            입력 시간이 최근인 순서입니다. 잘못 입력한 건만 삭제하면 진행도와 빈도에 반영되지 않습니다.
          </p>
        </div>
        <label className="text-xs font-medium text-zinc-600">
          입력자
          <select
            className="ml-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800"
            value={entryFilter}
            onChange={(event) => {
              window.location.href = progressHref(slug, 1, event.target.value);
            }}
          >
            <option value="all">전체</option>
            {staff.map((row) => (
              <option key={row.userId} value={`staff:${row.userId}`}>
                직원 · {row.email}
              </option>
            ))}
            <option value="guest">게스트·비로그인</option>
          </select>
        </label>
      </div>

      {list.total === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">표시할 응답이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">입력 시간</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">구분</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">입력자</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">표본</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-50/80">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-800">
                    {formatSubmittedAt(entry.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {entry.kind === "staff" ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-900">
                        직원{entry.roleLabel ? ` · ${entry.roleLabel}` : ""}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {entry.email ? "게스트" : "비로그인"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-800">{entryLabel(entry)}</td>
                  <td className="px-4 py-3 text-zinc-600">{entry.sampleUid || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteResponseButton slug={slug} entry={entry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3 text-sm text-zinc-600">
          <p>
            {list.total.toLocaleString()}건 · {list.page} / {pageCount}페이지
          </p>
          <div className="flex gap-2">
            {list.page > 1 ? (
              <Link
                href={progressHref(slug, list.page - 1, entryFilter)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50"
              >
                이전
              </Link>
            ) : null}
            {list.page < pageCount ? (
              <Link
                href={progressHref(slug, list.page + 1, entryFilter)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50"
              >
                다음
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
