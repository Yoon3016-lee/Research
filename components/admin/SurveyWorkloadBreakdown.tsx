import Link from "next/link";
import { Download } from "lucide-react";
import type { SurveyWorkloadStats } from "@/lib/survey-workload";

function WorkloadTable({
  staff,
  guestTotal,
  guestAnonymous,
  guestLoggedIn,
  totalSubmissions,
  showTotal = true,
}: {
  staff: SurveyWorkloadStats["staff"];
  guestTotal: number;
  guestAnonymous: number;
  guestLoggedIn: number;
  totalSubmissions: number;
  showTotal?: boolean;
}) {
  const staffSum = staff.reduce((s, r) => s + r.count, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-zinc-100 bg-zinc-50/80">
          <tr>
            <th className="px-4 py-3 font-semibold text-zinc-700">구분</th>
            <th className="px-4 py-3 font-semibold text-zinc-700">이메일 / 설명</th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">제출 수</th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-700">비율</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {staff.map((row) => (
            <tr key={row.userId} className="hover:bg-zinc-50/80">
              <td className="px-4 py-3">
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-900">
                  직원
                </span>
                <span className="ml-2 text-xs text-zinc-500">{row.roleLabel}</span>
              </td>
              <td className="px-4 py-3 text-zinc-800">{row.email}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">
                {row.count.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                {totalSubmissions > 0
                  ? `${Math.round((row.count / totalSubmissions) * 1000) / 10}%`
                  : "—"}
              </td>
            </tr>
          ))}
          <tr className="bg-amber-50/50">
            <td className="px-4 py-3">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                게스트 전체
              </span>
            </td>
            <td className="px-4 py-3 text-zinc-700">
              비로그인 {guestAnonymous.toLocaleString()}건
              {guestLoggedIn > 0
                ? ` · 게스트 계정 ${guestLoggedIn.toLocaleString()}건`
                : null}
            </td>
            <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">
              {guestTotal.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
              {totalSubmissions > 0
                ? `${Math.round((guestTotal / totalSubmissions) * 1000) / 10}%`
                : "—"}
            </td>
          </tr>
          {showTotal ? (
            <tr className="bg-zinc-50 font-medium">
              <td className="px-4 py-3 text-zinc-700" colSpan={2}>
                합계 (직원 {staffSum.toLocaleString()} + 게스트 {guestTotal.toLocaleString()})
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                {totalSubmissions.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-zinc-600">100%</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function SurveyWorkloadSection({ workload }: { workload: SurveyWorkloadStats }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">이 설문 작업량</h2>
          <p className="mt-1 text-sm text-zinc-600">
            <strong className="font-medium text-zinc-800">{workload.title}</strong>
            <span className="mx-2 text-zinc-300">|</span>
            총 제출 {workload.totalSubmissions.toLocaleString()}건
          </p>
        </div>
        {workload.totalSubmissions > 0 ? (
          <Link
            href={{
              pathname: "/admin/progress/export",
              query: { survey: workload.slug },
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100"
          >
            <Download className="h-4 w-4" aria-hidden />
            응답 데이터 다운로드
          </Link>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">
        {workload.totalSubmissions === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">이 설문에 제출된 응답이 없습니다.</p>
        ) : (
          <WorkloadTable
            staff={workload.staff}
            guestTotal={workload.guestTotal}
            guestAnonymous={workload.guestAnonymous}
            guestLoggedIn={workload.guestLoggedIn}
            totalSubmissions={workload.totalSubmissions}
          />
        )}
      </div>
    </section>
  );
}
