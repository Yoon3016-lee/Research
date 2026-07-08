import type { AdminSurveyRow } from "@/lib/survey-list-types";
import { addDaysToDateOnly, toDateOnlyString } from "@/lib/survey-period";

const ALERT_WINDOW_DAYS = 7;

function daysFromToday(target: string, today: string): number {
  const [ty, tm, td] = today.split("-").map(Number);
  const [y, m, d] = target.split("-").map(Number);
  const t0 = new Date(ty, tm - 1, td).getTime();
  const t1 = new Date(y, m - 1, d).getTime();
  return Math.round((t1 - t0) / 86_400_000);
}

function formatDday(days: number, kind: "end" | "start"): string {
  if (days === 0) {
    return kind === "end" ? "오늘 마감" : "오늘 시작";
  }
  if (days === 1) {
    return kind === "end" ? "내일 마감" : "내일 시작";
  }
  if (days > 0) {
    return kind === "end" ? `마감 D-${days}` : `시작 D-${days}`;
  }
  return kind === "end" ? "마감일 경과" : "시작일 경과";
}

export type SurveyProgressItem = {
  survey: AdminSurveyRow;
  percent: number;
  responses: number;
  target: number;
};

export type SurveyScheduleAlert = {
  survey: AdminSurveyRow;
  kind: "closing" | "starting";
  days: number;
  label: string;
};

export function buildDashboardSurveyInsights(surveys: AdminSurveyRow[]): {
  progressItems: SurveyProgressItem[];
  scheduleAlerts: SurveyScheduleAlert[];
} {
  const today = toDateOnlyString();
  const windowEnd = addDaysToDateOnly(today, ALERT_WINDOW_DAYS);

  const progressItems: SurveyProgressItem[] = surveys
    .filter((s) => s.status === "진행중")
    .map((survey) => {
      const target = Math.max(survey.targetCount ?? 0, 1);
      const responses = survey.responses;
      const percent = Math.min(100, Math.round((responses / target) * 100));
      return { survey, percent, responses, target };
    })
    .sort((a, b) => b.percent - a.percent);

  const scheduleAlerts: SurveyScheduleAlert[] = [];

  for (const survey of surveys) {
    const end = survey.periodEnd?.trim();
    if (survey.status === "진행중" && end && end >= today && end <= windowEnd) {
      const days = daysFromToday(end, today);
      scheduleAlerts.push({
        survey,
        kind: "closing",
        days,
        label: formatDday(days, "end"),
      });
    }

    const start = survey.periodStart?.trim();
    if (survey.status === "예정" && start && start >= today && start <= windowEnd) {
      const days = daysFromToday(start, today);
      scheduleAlerts.push({
        survey,
        kind: "starting",
        days,
        label: formatDday(days, "start"),
      });
    }
  }

  scheduleAlerts.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "closing" ? -1 : 1;
    return a.days - b.days;
  });

  return { progressItems, scheduleAlerts };
}
