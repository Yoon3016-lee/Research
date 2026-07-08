import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  AdminSurveyIconActions,
  AdminSurveyStatusBadge,
} from "@/components/admin/AdminSurveyIconActions";
import {
  DashboardProgressSection,
  DashboardScheduleAlertsSection,
} from "@/components/admin/DashboardSurveyInsights";
import { buildDashboardSurveyInsights } from "@/lib/admin-dashboard";
import { getAdminSurveys } from "@/lib/surveys-db";

export default async function AdminDashboardPage() {
  const adminSurveys = await getAdminSurveys();
  const { progressItems, scheduleAlerts } = buildDashboardSurveyInsights(adminSurveys);
  const totalResponses = adminSurveys.reduce((a, s) => a + s.responses, 0);
  const activeSurveys = adminSurveys.filter((s) => s.status === "진행중").length;

  return (
    <>
      <AdminHeader
        title="대시보드"
        description="설문·응답 현황과 일정 알림을 한눈에 확인합니다."
      />
      <div className="space-y-8 p-4 sm:p-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "진행중 설문", value: String(activeSurveys), hint: "건" },
            {
              label: "누적 응답(설문)",
              value: totalResponses.toLocaleString(),
              hint: "건",
            },
            { label: "전체 설문", value: String(adminSurveys.length), hint: "건" },
            {
              label: "예정·종료",
              value: String(adminSurveys.length - activeSurveys),
              hint: "건",
            },
          ].map((k) => (
            <div key={k.label} className="admin-stat-card">
              <p className="text-sm font-medium text-brand-700">{k.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-brand-900">
                {k.value}
                <span className="ml-1 text-base font-normal text-brand-700">{k.hint}</span>
              </p>
            </div>
          ))}
        </section>

        <section className="admin-card p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-brand-900">최근 설문</h2>
            <Link
              href="/admin/surveys"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-500"
            >
              전체
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {adminSurveys.length === 0 ? (
            <p className="mt-4 text-sm text-brand-700">
              등록된 설문이 없습니다.{" "}
              <Link href="/admin/surveys/new" className="font-medium text-accent-600 hover:text-accent-500">
                새 설문 만들기
              </Link>
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-900/8 text-xs font-medium text-brand-700/80">
                    <th className="pb-2.5 pr-3 font-medium">설문</th>
                    <th className="pb-2.5 pr-3 font-medium">상태</th>
                    <th className="hidden pb-2.5 pr-3 font-medium sm:table-cell">응답</th>
                    <th className="pb-2.5 text-right font-medium">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/6">
                  {adminSurveys.slice(0, 5).map((s) => (
                    <tr key={s.id} className="group transition hover:bg-surface/50">
                      <td className="py-3 pr-3">
                        <p className="truncate font-medium text-brand-900">{s.title}</p>
                        <p className="mt-0.5 text-xs text-brand-700/70">
                          {s.updatedAt}
                          <span className="mx-1 opacity-40">·</span>
                          <span className="font-mono text-[11px]">{s.id}</span>
                        </p>
                      </td>
                      <td className="py-3 pr-3 align-middle">
                        <AdminSurveyStatusBadge status={s.status} />
                      </td>
                      <td className="hidden py-3 pr-3 align-middle tabular-nums text-brand-800 sm:table-cell">
                        {s.responses.toLocaleString()}
                      </td>
                      <td className="py-3 align-middle">
                        <AdminSurveyIconActions slug={s.id} status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <DashboardProgressSection items={progressItems} />
          <DashboardScheduleAlertsSection alerts={scheduleAlerts} />
        </section>
      </div>
    </>
  );
}
