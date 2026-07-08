import Link from "next/link";
import { Calendar, ChevronRight, Clock, Users } from "lucide-react";
import { SiteContainer } from "@/components/site/SiteContainer";
import { getPublicOngoingSurveys } from "@/lib/surveys-db";
import type { SurveyStatus } from "@/lib/survey-list-types";

export const metadata = {
  title: "진행중 설문 | Research Hub",
  description: "진행중·예정 설문조사 목록",
};

function statusBadgeClass(status: SurveyStatus): string {
  if (status === "진행중") {
    return "rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.8125rem] font-medium text-emerald-800";
  }
  if (status === "예정") {
    return "rounded-full bg-amber-50 px-2.5 py-0.5 text-[0.8125rem] font-medium text-amber-900";
  }
  return "rounded-full bg-brand-900/8 px-2.5 py-0.5 text-[0.8125rem] font-medium text-brand-800";
}

export default async function SurveysPage() {
  const surveys = await getPublicOngoingSurveys();
  const ongoingCount = surveys.filter((s) => s.status === "진행중").length;
  const scheduledCount = surveys.filter((s) => s.status === "예정").length;

  return (
    <SiteContainer as="main" className="py-10 sm:py-12 lg:py-14">
      <div className="max-w-3xl">
        <h1 className="font-semibold text-brand-900">진행중인 설문</h1>
        <p className="mt-2 text-brand-700">
          공개로 설정된 <strong>진행중</strong>·<strong>예정</strong> 설문을 표시합니다.
          예정 설문은 목록에서 안내만 보이며, 기간이 시작된 뒤(진행중)에 참여할 수 있습니다.
        </p>
      </div>

      {surveys.length === 0 ? (
        <p className="site-card mt-10 border-dashed text-center text-brand-700">
          표시할 설문이 없습니다. 관리자 →{" "}
          <Link href="/admin/surveys/new" className="font-medium text-accent-600 hover:text-accent-500">
            새 설문 만들기
          </Link>
          에서 설문을 추가하고 공개 목록 표시를 켜 주세요.
        </p>
      ) : (
        <>
          {scheduledCount > 0 ? (
            <p className="mt-6 text-sm text-brand-700/80">
              참여 가능 {ongoingCount}건 · 시작 예정 {scheduledCount}건
            </p>
          ) : null}
          <ul className="mt-6 space-y-4 sm:mt-10">
            {surveys.map((s) => {
              const canParticipate = s.status === "진행중";
              const pct = Math.min(
                100,
                Math.round((s.responseCount / Math.max(s.targetCount, 1)) * 100),
              );
              return (
                <li
                  key={s.id}
                  className={`site-card overflow-hidden p-0 ${
                    canParticipate ? "" : "border-amber-200/60 bg-amber-50/30"
                  }`}
                >
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={statusBadgeClass(s.status)}>{s.status}</span>
                        <span className="text-xs text-brand-700/70">ID · {s.id}</span>
                      </div>
                      <h2 className="mt-2 text-xl font-semibold">{s.title}</h2>
                      <p className="mt-1 text-brand-700">{s.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-brand-700/80">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" aria-hidden />
                          {s.periodLabel || "기간 미정"}
                        </span>
                        {canParticipate ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4" aria-hidden />
                            응답 {s.responseCount.toLocaleString()} / 목표{" "}
                            {s.targetCount.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      {canParticipate ? (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-brand-700/80">
                            <span>진행률</span>
                            <span>{pct}%</span>
                          </div>
                          <div
                            className="mt-1 h-2 overflow-hidden rounded-full bg-brand-900/8"
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-brand-800 transition-[width]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-900/90">
                          <Clock className="h-4 w-4 shrink-0" aria-hidden />
                          아직 시작 전입니다. 기간이 시작되면 참여할 수 있습니다.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      {canParticipate ? (
                        <Link
                          href={`/survey/${s.id}`}
                          className="site-btn-primary px-4 py-2.5 text-sm"
                        >
                          설문 참여하기
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </Link>
                      ) : (
                        <span
                          className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-base font-semibold text-amber-900"
                          aria-disabled="true"
                        >
                          시작 전
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </SiteContainer>
  );
}
