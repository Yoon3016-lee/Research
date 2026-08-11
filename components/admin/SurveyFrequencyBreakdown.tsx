"use client";

import { useId, useMemo, useState } from "react";
import { BarChart2, BarChart3, PieChart } from "lucide-react";
import type { FrequencyBucket, QuestionFrequencyStats, SurveyResponseStats } from "@/lib/survey-response-stats-shared";
import { NO_ANSWER_LABEL } from "@/lib/survey-response-stats-shared";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import {
  FREQ_GUEST_H_CLASS,
  FREQ_GUEST_V_CLASS,
  FREQ_STAFF_H_CLASS,
  FREQ_STAFF_V_CLASS,
  ProgressGradientBar,
  progressBarIntensity,
  type ProgressBarTone,
} from "@/components/admin/ProgressGradientBar";

type Props = {
  stats: Extract<SurveyResponseStats, { ok: true }>;
  /** 설문 상태 톤 — 종료면 completed(파랑), 아니면 active(주황) */
  tone?: ProgressBarTone;
};

type ChartType = "horizontal" | "vertical" | "pie";

const CHART_OPTIONS: {
  value: ChartType;
  label: string;
  icon: typeof BarChart3;
}[] = [
  { value: "horizontal", label: "가로 막대", icon: BarChart3 },
  { value: "vertical", label: "세로 막대", icon: BarChart2 },
  { value: "pie", label: "원형", icon: PieChart },
];

const PIE_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

function RespondentLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-800 to-sky-400"
          aria-hidden
        />
        직원
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-amber-700 to-amber-300"
          aria-hidden
        />
        게스트
      </span>
    </div>
  );
}

function ChartTypeSelect({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (next: ChartType) => void;
}) {
  return (
    <div
      className="inline-flex shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-1"
      role="group"
      aria-label="그래프 종류"
    >
      {CHART_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
            }`}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RespondentDistributionBar({
  staffCount,
  guestCount,
  maxTotal,
}: {
  staffCount: number;
  guestCount: number;
  maxTotal: number;
}) {
  const total = staffCount + guestCount;
  if (total <= 0) {
    return <div className="h-2 rounded-full bg-zinc-100" role="presentation" />;
  }

  const scale = maxTotal > 0 ? 100 / maxTotal : 0;
  const staffW = staffCount * scale;
  const guestW = guestCount * scale;
  const intensity = progressBarIntensity(total, maxTotal);

  return (
    <div
      className="flex h-2.5 min-w-[4rem] overflow-hidden rounded-full bg-zinc-100"
      role="presentation"
      title={`직원 ${staffCount} · 게스트 ${guestCount}`}
      style={{ opacity: intensity }}
    >
      {staffCount > 0 ? (
        <div className={FREQ_STAFF_H_CLASS} style={{ width: `${staffW}%` }} />
      ) : null}
      {guestCount > 0 ? (
        <div className={FREQ_GUEST_H_CLASS} style={{ width: `${guestW}%` }} />
      ) : null}
    </div>
  );
}

function HorizontalChart({ q }: { q: QuestionFrequencyStats }) {
  const maxTotal = Math.max(...q.buckets.map((b) => b.count), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs text-zinc-500">
            <th className="pb-2 pr-3 font-medium">항목</th>
            <th className="pb-2 pr-3 text-right font-medium tabular-nums text-blue-700">
              직원
            </th>
            <th className="pb-2 pr-3 text-right font-medium tabular-nums text-amber-800">
              게스트
            </th>
            <th className="pb-2 pr-3 text-right font-medium tabular-nums">합계</th>
            <th className="pb-2 pr-3 text-right font-medium tabular-nums">비율</th>
            <th className="pb-2 font-medium">분포</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {q.buckets.map((b) => {
            const isNoAnswer = b.label === NO_ANSWER_LABEL;
            return (
              <tr key={b.key} className={isNoAnswer ? "bg-zinc-50/80" : undefined}>
                <td className="py-2.5 pr-3 align-middle">
                  <span
                    className={
                      isNoAnswer ? "font-medium text-zinc-700" : "text-zinc-800"
                    }
                  >
                    {b.label}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right align-middle tabular-nums font-medium text-blue-700">
                  {b.staffCount.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 text-right align-middle tabular-nums font-medium text-amber-800">
                  {b.guestCount.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 text-right align-middle tabular-nums text-zinc-800">
                  {b.count.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 text-right align-middle tabular-nums text-zinc-600">
                  {b.percent}%
                </td>
                <td className="py-2.5 align-middle">
                  <RespondentDistributionBar
                    staffCount={b.staffCount}
                    guestCount={b.guestCount}
                    maxTotal={maxTotal}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VerticalChart({ q }: { q: QuestionFrequencyStats }) {
  const maxTotal = Math.max(...q.buckets.map((b) => b.count), 1);
  const chartH = 180;
  const colMinW = 72;

  return (
    <div className="space-y-3">
      <RespondentLegend />
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: `${Math.max(q.buckets.length * colMinW, 240)}px` }}>
          <div className="flex gap-3">
            {q.buckets.map((b) => {
              const totalH = (b.count / maxTotal) * chartH;
              const staffH =
                b.count > 0 ? (b.staffCount / b.count) * totalH : 0;
              const guestH =
                b.count > 0 ? (b.guestCount / b.count) * totalH : 0;
              const intensity = progressBarIntensity(b.count, maxTotal);
              return (
                <div
                  key={b.key}
                  className="flex min-w-[4.5rem] flex-1 flex-col items-center"
                  title={`${b.label}: 직원 ${b.staffCount} · 게스트 ${b.guestCount} · 합계 ${b.count} (${b.percent}%)`}
                >
                  <span className="mb-1 text-[0.6875rem] tabular-nums text-zinc-600">
                    {b.count}
                  </span>
                  <div
                    className="flex w-8 shrink-0 flex-col justify-end overflow-hidden rounded-t-md bg-zinc-100"
                    style={{ height: chartH }}
                  >
                    <div
                      className="flex w-full flex-col-reverse"
                      style={{
                        height: Math.max(totalH, b.count > 0 ? 2 : 0),
                        opacity: intensity,
                      }}
                    >
                      {staffH > 0 ? (
                        <div
                          className={FREQ_STAFF_V_CLASS}
                          style={{ height: staffH }}
                        />
                      ) : null}
                      {guestH > 0 ? (
                        <div
                          className={FREQ_GUEST_V_CLASS}
                          style={{ height: guestH }}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-3">
            {q.buckets.map((b) => {
              const isNoAnswer = b.label === NO_ANSWER_LABEL;
              return (
                <p
                  key={b.key}
                  className={`min-w-[4.5rem] flex-1 whitespace-normal break-words text-center text-[0.6875rem] leading-snug ${
                    isNoAnswer ? "font-medium text-zinc-600" : "text-zinc-700"
                  }`}
                >
                  {b.label}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArc,
    0,
    end.x,
    end.y,
    "L",
    cx,
    cy,
    "Z",
  ].join(" ");
}

function sliceColor(bucket: FrequencyBucket, index: number) {
  if (bucket.label === NO_ANSWER_LABEL) return "#a1a1aa";
  return PIE_COLORS[index % PIE_COLORS.length]!;
}

function PieChartView({ q }: { q: QuestionFrequencyStats }) {
  const uid = useId();
  const total = useMemo(
    () => q.buckets.reduce((sum, b) => sum + b.count, 0),
    [q.buckets],
  );

  if (total <= 0) {
    return <p className="text-sm text-zinc-500">집계할 응답이 없습니다.</p>;
  }

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 84;
  let angle = 0;
  const slices = q.buckets
    .filter((b) => b.count > 0)
    .map((b, index) => {
      const sweep = (b.count / total) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      return { bucket: b, index, start, end, sweep };
    });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-48 w-48 shrink-0"
        role="img"
        aria-label={`${q.prompt} 응답 원형 그래프`}
      >
        {slices.length === 1 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={sliceColor(slices[0]!.bucket, slices[0]!.index)}
          >
            <title>
              {slices[0]!.bucket.label}: {slices[0]!.bucket.count} (
              {slices[0]!.bucket.percent}%)
            </title>
          </circle>
        ) : (
          slices.map(({ bucket, index, start, end, sweep }) => {
            // 360° 단일 조각은 circle로 처리했으므로 여기선 sweep < 360
            const path =
              sweep >= 359.99
                ? undefined
                : describeArc(cx, cy, r, start, end);
            if (!path) return null;
            return (
              <path
                key={`${uid}-${bucket.key}`}
                d={path}
                fill={sliceColor(bucket, index)}
              >
                <title>
                  {bucket.label}: {bucket.count} ({bucket.percent}%) · 직원{" "}
                  {bucket.staffCount} · 게스트 {bucket.guestCount}
                </title>
              </path>
            );
          })
        )}
        <circle cx={cx} cy={cy} r={42} fill="white" />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="#18181b"
          fontSize="13"
          fontWeight="600"
        >
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#71717a" fontSize="10">
          합계
        </text>
      </svg>

      <ul className="grid min-w-0 flex-1 gap-2 sm:grid-cols-1">
        {q.buckets.map((b, index) => (
          <li
            key={b.key}
            className="flex items-start gap-2 text-sm text-zinc-700"
          >
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: sliceColor(b, index) }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span
                  className={
                    b.label === NO_ANSWER_LABEL
                      ? "font-medium text-zinc-700"
                      : "text-zinc-800"
                  }
                >
                  {b.label}
                </span>
                <span className="tabular-nums text-zinc-600">
                  {b.count.toLocaleString()} · {b.percent}%
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
                직원 {b.staffCount.toLocaleString()} · 게스트{" "}
                {b.guestCount.toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionFrequencyCard({
  q,
  displayLabel,
  chartType,
  tone,
}: {
  q: QuestionFrequencyStats;
  displayLabel: string;
  chartType: ChartType;
  tone: ProgressBarTone;
}) {
  const answerRate =
    q.totalSubmissions > 0
      ? Math.round((q.answeredCount / q.totalSubmissions) * 100)
      : 0;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-medium ${
              q.type === "info_media" ? "text-rose-800" : "text-indigo-700"
            }`}
          >
            {displayLabel} · {QUESTION_TYPE_LABELS[q.type]}
            {q.allowSkip && q.type !== "info_media" ? (
              <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
                무응답 허용
              </span>
            ) : null}
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-900">{q.prompt}</h3>
        </div>
        <p className="text-xs text-zinc-500 tabular-nums">
          응답 {q.answeredCount.toLocaleString()} / 제출{" "}
          {q.totalSubmissions.toLocaleString()}
          <span className="ml-1.5 font-medium text-zinc-700">{answerRate}%</span>
        </p>
      </div>

      {q.type !== "info_media" ? (
        <ProgressGradientBar
          percent={answerRate}
          label={`${displayLabel} 응답률 ${answerRate}%`}
          className="mt-3"
          trackClassName="bg-zinc-100"
          tone={tone}
        />
      ) : null}

      {chartType === "horizontal" ? (
        <div className="mt-3">
          <RespondentLegend />
        </div>
      ) : null}

      {q.buckets.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">집계할 응답이 없습니다.</p>
      ) : (
        <div className="mt-4">
          {chartType === "horizontal" ? <HorizontalChart q={q} /> : null}
          {chartType === "vertical" ? <VerticalChart q={q} /> : null}
          {chartType === "pie" ? <PieChartView q={q} /> : null}
        </div>
      )}

      {q.type === "mc_multi" && q.answeredCount > 0 ? (
        <p className="mt-3 text-xs text-zinc-500">
          다중 선택 문항은 보기별 선택 횟수입니다(한 응답자가 여러 보기를 고를 수 있어
          합계가 제출 수보다 클 수 있습니다).
        </p>
      ) : null}
    </article>
  );
}

export function SurveyFrequencyBreakdown({ stats, tone = "active" }: Props) {
  const [chartType, setChartType] = useState<ChartType>("horizontal");
  const answerableCount = stats.questions.filter((q) => q.type !== "info_media").length;
  let answerableIndex = 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h3 className="text-sm font-semibold text-zinc-900">문항별 응답 빈도</h3>
          <p className="mt-1 text-sm text-zinc-600">
            제출 건수 대비 각 보기·답변·무응답 빈도입니다. 무응답은 답변 행이 없는
            제출(건너뛰기·빈 칸)입니다.
          </p>
        </div>
        <ChartTypeSelect value={chartType} onChange={setChartType} />
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
        <p className="font-medium text-indigo-950">{stats.title}</p>
        <p className="mt-1 text-sm text-indigo-900/90">
          총 제출{" "}
          <strong className="tabular-nums">
            {stats.totalSubmissions.toLocaleString()}
          </strong>
          건 · 문항 {answerableCount}개
          {stats.questions.length > answerableCount
            ? ` · 안내 ${stats.questions.length - answerableCount}`
            : ""}
          <span className="mx-2 text-indigo-300">|</span>
          slug <code className="rounded bg-white/80 px-1 text-xs">{stats.slug}</code>
        </p>
        {chartType !== "pie" ? (
          <div className="mt-2">
            <RespondentLegend />
          </div>
        ) : (
          <p className="mt-2 text-xs text-indigo-900/80">
            원형 그래프는 항목별 합계(직원+게스트) 비율입니다. 범례에서 직원·게스트
            수를 확인할 수 있습니다.
          </p>
        )}
      </div>

      {stats.questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-600">
          이 설문에 등록된 문항이 없습니다.
        </p>
      ) : (
        stats.questions.map((q) => {
          const displayLabel =
            q.type === "info_media" ? "안내" : `문항 ${++answerableIndex}`;
          return (
            <QuestionFrequencyCard
              key={q.questionId}
              q={q}
              displayLabel={displayLabel}
              chartType={chartType}
              tone={tone}
            />
          );
        })
      )}
    </section>
  );
}
