import Link from "next/link";
import { Calendar, ChevronRight, Users } from "lucide-react";
import { getPublicOngoingSurveys } from "@/lib/surveys-db";

export const metadata = {
  title: "진행중 설문 | Research Hub",
  description: "현재 진행중인 설문조사 목록",
};

export default async function SurveysPage() {
  const ongoingSurveys = await getPublicOngoingSurveys();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          진행중인 설문
        </h1>
        <p className="mt-2 text-zinc-600">
          Supabase에 저장된 진행중·공개 설문만 표시됩니다. 관리자에서 설문을 만든 뒤 상태를
          「진행중」으로 설정하세요.
        </p>
      </div>

      {ongoingSurveys.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 text-center text-sm text-zinc-600">
          표시할 진행중 설문이 없습니다. 관리자 →{" "}
          <Link href="/admin/surveys/new" className="font-medium text-indigo-700 hover:text-indigo-900">
            새 설문 만들기
          </Link>
          에서 설문을 추가하세요.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {ongoingSurveys.map((s) => {
            const pct = Math.min(
              100,
              Math.round((s.responseCount / Math.max(s.targetCount, 1)) * 100),
            );
            return (
              <li
                key={s.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        {s.status}
                      </span>
                      <span className="text-xs text-zinc-500">ID · {s.id}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-zinc-900">{s.title}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{s.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" aria-hidden />
                        {s.periodLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" aria-hidden />
                        응답 {s.responseCount.toLocaleString()} / 목표{" "}
                        {s.targetCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>진행률</span>
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
                          className="h-full rounded-full bg-indigo-600 transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Link
                      href={`/survey/${s.id}`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                    >
                      설문 참여하기
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
