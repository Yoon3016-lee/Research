import Link from "next/link";
import { ArrowUpRight, ClipboardList, Mail, Users } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSurveys } from "@/lib/surveys-db";

export default async function AdminDashboardPage() {
  const adminSurveys = await getAdminSurveys();
  const totalResponses = adminSurveys.reduce((a, s) => a + s.responses, 0);
  const activeSurveys = adminSurveys.filter((s) => s.status === "진행중").length;

  return (
    <>
      <AdminHeader
        title="대시보드"
        description="Supabase에 저장된 설문·응답 요약입니다."
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
            <ul className="mt-4 divide-y divide-brand-900/6">
              {adminSurveys.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-900">{s.title}</p>
                    <p className="text-xs text-brand-700/80">수정 {s.updatedAt}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-900/6 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-brand-900">바로가기</h2>
            <Link
              href="/admin/progress"
              className="text-xs font-medium text-accent-600 hover:text-accent-500"
            >
              진행·업무 현황 →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/surveys"
              className="flex items-center gap-3 rounded-xl border border-brand-900/8 bg-surface/80 p-4 transition hover:border-accent-500/30 hover:bg-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-900 shadow-sm">
                <ClipboardList className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-brand-900">설문 추가·변경</span>
            </Link>
            <Link
              href="/admin/emails"
              className="flex items-center gap-3 rounded-xl border border-brand-900/8 bg-surface/80 p-4 transition hover:border-accent-500/30 hover:bg-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-900 shadow-sm">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-brand-900">이메일 전송</span>
            </Link>
            <Link
              href="/admin/progress"
              className="flex items-center gap-3 rounded-xl border border-brand-900/8 bg-surface/80 p-4 transition hover:border-accent-500/30 hover:bg-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-900 shadow-sm">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-brand-900">진행 현황</span>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
