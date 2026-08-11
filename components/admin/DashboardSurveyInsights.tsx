import Link from "next/link";
import { CalendarClock, TrendingUp } from "lucide-react";
import type { SurveyProgressItem, SurveyScheduleAlert } from "@/lib/admin-dashboard";
import { ProgressGradientBar } from "@/components/admin/ProgressGradientBar";

export function DashboardProgressSection({ items }: { items: SurveyProgressItem[] }) {
  return (
    <section className="admin-card flex h-full flex-col p-6">
      <div className="flex items-start gap-2">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-brand-900">진행중 설문 진행률</h2>
          <p className="mt-0.5 text-xs text-brand-700/80">목표 응답 수 대비 현재 수집 현황</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-brand-900/10 bg-surface/50 px-4 py-10 text-center text-sm text-brand-700">
          현재 진행중인 설문이 없습니다.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map(({ survey, percent, responses, target }) => (
            <li key={survey.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-brand-900">{survey.title}</p>
                  <p className="mt-0.5 text-xs text-brand-700/70">
                    {responses.toLocaleString()} / {target.toLocaleString()}건
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-900">
                  {percent}%
                </span>
              </div>
              <ProgressGradientBar
                percent={percent}
                label={`${survey.title} 진행률 ${percent}%`}
                className="mt-2"
                tone="active"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DashboardScheduleAlertsSection({
  alerts,
}: {
  alerts: SurveyScheduleAlert[];
}) {
  const closing = alerts.filter((a) => a.kind === "closing");
  const starting = alerts.filter((a) => a.kind === "starting");

  return (
    <section className="admin-card flex h-full flex-col p-6">
      <div className="flex items-start gap-2">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-brand-900">일정 알림</h2>
          <p className="mt-0.5 text-xs text-brand-700/80">7일 이내 마감·시작 예정 설문</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <p className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-brand-900/10 bg-surface/50 px-4 py-10 text-center text-sm text-brand-700">
          임박한 마감·시작 일정이 없습니다.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {closing.length > 0 ? (
            <AlertGroup title="마감 임박" tone="closing" alerts={closing} />
          ) : null}
          {starting.length > 0 ? (
            <AlertGroup title="시작 예정" tone="starting" alerts={starting} />
          ) : null}
        </div>
      )}
    </section>
  );
}

function AlertGroup({
  title,
  tone,
  alerts,
}: {
  title: string;
  tone: "closing" | "starting";
  alerts: SurveyScheduleAlert[];
}) {
  const isClosing = tone === "closing";
  const groupTitleClass = isClosing ? "text-red-800" : "text-amber-800";
  const itemClass = isClosing
    ? "border-red-200/70 bg-red-50/50"
    : "border-amber-200/70 bg-amber-50/40";
  const badgeClass = isClosing
    ? "bg-red-100 text-red-900 ring-red-300/60"
    : "bg-amber-100 text-amber-950 ring-amber-300/60";
  const actionLinkClass = isClosing
    ? "text-red-700 hover:text-red-900"
    : "text-amber-800 hover:text-amber-950";

  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide ${groupTitleClass}`}>
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {alerts.map(({ survey, label }) => (
          <li
            key={`${tone}-${survey.id}`}
            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${itemClass}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-brand-900">{survey.title}</p>
              <p className="mt-0.5 truncate text-xs text-brand-700/70">
                {survey.periodLabel || "기간 미정"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${badgeClass}`}
              >
                {label}
              </span>
              <div className="flex flex-wrap justify-end gap-x-2.5 gap-y-0.5">
                <Link
                  href={{
                    pathname: "/admin/progress",
                    query: { survey: survey.id },
                  }}
                  className={`text-[11px] font-medium whitespace-nowrap ${actionLinkClass}`}
                >
                  진행 현황
                </Link>
                {survey.status === "진행중" ? (
                  <Link
                    href={`/survey/${survey.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[11px] font-medium whitespace-nowrap ${actionLinkClass}`}
                  >
                    참여 링크
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
