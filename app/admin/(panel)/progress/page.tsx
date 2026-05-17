import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyWorkloadSection } from "@/components/admin/SurveyWorkloadBreakdown";
import { SurveyFrequencyBreakdown } from "@/components/admin/SurveyFrequencyBreakdown";
import { getSurveyResponseStats } from "@/lib/survey-response-stats";
import { getSurveyWorkload } from "@/lib/survey-workload";
import { getAdminSurveys } from "@/lib/surveys-db";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "진행·업무 현황" };

export const dynamic = "force-dynamic";

export default async function AdminProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ survey?: string }>;
}) {
  const { survey: surveyParam } = await searchParams;
  const selectedSlug = surveyParam?.trim() ?? "";
  const adminSurveys = await getAdminSurveys();
  const [stats, surveyWorkload] = await Promise.all([
    selectedSlug ? getSurveyResponseStats(selectedSlug) : Promise.resolve(null),
    selectedSlug ? getSurveyWorkload(selectedSlug) : Promise.resolve(null),
  ]);

  return (
    <>
      <AdminHeader
        title="진행·업무 현황"
        description="설문별 진행도·작업량·문항별 응답 빈도를 확인합니다."
      />
      <div className="space-y-10 p-4 sm:p-6">
        <section>
          <h2 className="text-sm font-semibold text-zinc-900">설문 진행도</h2>
          <p className="mt-1 text-sm text-zinc-600">
            목표 대비 응답 수·상태를 확인합니다.「응답 분석」을 누르면 해당 설문의
            작업량·문항별 빈도를 볼 수 있습니다.
          </p>
          {adminSurveys.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-600">
              등록된 설문이 없습니다.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {adminSurveys.map((s) => {
                const target =
                  s.targetCount != null && s.targetCount > 0
                    ? s.targetCount
                    : s.responses > 0
                      ? Math.max(s.responses * 2, 100)
                      : 100;
                const pct = Math.min(100, Math.round((s.responses / target) * 100));
                const isSelected = selectedSlug === s.id;
                return (
                  <li
                    key={s.id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm ${
                      isSelected
                        ? "border-indigo-300 ring-2 ring-indigo-500/20"
                        : "border-zinc-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">{s.title}</p>
                        <p className="text-xs text-zinc-500">ID · {s.id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
                          {s.status}
                        </span>
                        <Link
                          href={{ pathname: "/admin/progress", query: { survey: s.id } }}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                          }`}
                        >
                          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                          응답 분석
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>
                          응답 {s.responses.toLocaleString()} / 목표{" "}
                          {target.toLocaleString()}
                          {s.targetCount == null || s.targetCount <= 0 ? " (추정)" : ""}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div
                        className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {selectedSlug && surveyWorkload ? (
          <SurveyWorkloadSection workload={surveyWorkload} />
        ) : null}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">문항별 응답 빈도</h2>
              <p className="mt-1 text-sm text-zinc-600">
                제출 건수 대비 각 보기·답변·무응답 빈도입니다. 무응답은 답변 행이 없는
                제출(건너뛰기·빈 칸)입니다.
              </p>
            </div>
            {selectedSlug ? (
              <Link
                href="/admin/progress"
                className="text-sm font-medium text-indigo-700 hover:underline"
              >
                선택 해제
              </Link>
            ) : null}
          </div>

          {!selectedSlug ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-10 text-center text-sm text-zinc-600">
              위 목록에서 설문의「응답 분석」을 눌러 주세요.
            </p>
          ) : stats?.ok ? (
            <div className="mt-6">
              <SurveyFrequencyBreakdown stats={stats} />
            </div>
          ) : stats && !stats.ok && stats.reason === "not_configured" ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <code>SUPABASE_SERVICE_ROLE_KEY</code>가 설정되지 않았습니다.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              설문을 찾을 수 없거나 응답 데이터를 불러오지 못했습니다.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
