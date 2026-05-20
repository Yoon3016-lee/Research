import type { QuestionFrequencyStats, SurveyResponseStats } from "@/lib/survey-response-stats";
import { NO_ANSWER_LABEL } from "@/lib/survey-response-stats";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";

type Props = {
  stats: Extract<SurveyResponseStats, { ok: true }>;
};

function RespondentLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" aria-hidden />
        직원
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" aria-hidden />
        게스트
      </span>
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

  return (
    <div
      className="flex h-2 min-w-[4rem] overflow-hidden rounded-full bg-zinc-100"
      role="presentation"
      title={`직원 ${staffCount} · 게스트 ${guestCount}`}
    >
      {staffCount > 0 ? (
        <div className="h-full bg-blue-600" style={{ width: `${staffW}%` }} />
      ) : null}
      {guestCount > 0 ? (
        <div className="h-full bg-amber-400" style={{ width: `${guestW}%` }} />
      ) : null}
    </div>
  );
}

function QuestionFrequencyCard({ q, index }: { q: QuestionFrequencyStats; index: number }) {
  const maxTotal = Math.max(...q.buckets.map((b) => b.count), 1);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-indigo-700">
            문항 {index + 1} · {QUESTION_TYPE_LABELS[q.type]}
            {q.allowSkip ? (
              <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
                무응답 허용
              </span>
            ) : null}
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-900">{q.prompt}</h3>
        </div>
        <p className="text-xs text-zinc-500 tabular-nums">
          응답 {q.answeredCount.toLocaleString()} / 제출 {q.totalSubmissions.toLocaleString()}
        </p>
      </div>

      <div className="mt-3">
        <RespondentLegend />
      </div>

      {q.buckets.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">집계할 응답이 없습니다.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
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
      )}

      {q.type === "mc_multi" && q.answeredCount > 0 ? (
        <p className="mt-3 text-xs text-zinc-500">
          다중 선택 문항은 보기별 선택 횟수입니다(한 응답자가 여러 보기를 고를 수 있어 합계가
          제출 수보다 클 수 있습니다).
        </p>
      ) : null}
    </article>
  );
}

export function SurveyFrequencyBreakdown({ stats }: Props) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
        <p className="font-medium text-indigo-950">{stats.title}</p>
        <p className="mt-1 text-sm text-indigo-900/90">
          총 제출 <strong className="tabular-nums">{stats.totalSubmissions.toLocaleString()}</strong>
          건 · 문항 {stats.questions.length}개
          <span className="mx-2 text-indigo-300">|</span>
          slug <code className="rounded bg-white/80 px-1 text-xs">{stats.slug}</code>
        </p>
        <div className="mt-2">
          <RespondentLegend />
        </div>
      </div>

      {stats.questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-600">
          이 설문에 등록된 문항이 없습니다.
        </p>
      ) : (
        stats.questions.map((q, i) => (
          <QuestionFrequencyCard key={q.questionId} q={q} index={i} />
        ))
      )}
    </section>
  );
}
