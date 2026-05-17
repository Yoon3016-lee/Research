import type { QuestionFrequencyStats, SurveyResponseStats } from "@/lib/survey-response-stats";
import { NO_ANSWER_LABEL } from "@/lib/survey-response-stats";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";

type Props = {
  stats: Extract<SurveyResponseStats, { ok: true }>;
};

function QuestionFrequencyCard({ q, index }: { q: QuestionFrequencyStats; index: number }) {
  const maxCount = Math.max(...q.buckets.map((b) => b.count), 1);

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

      {q.buckets.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">집계할 응답이 없습니다.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-500">
                <th className="pb-2 pr-4 font-medium">항목</th>
                <th className="pb-2 pr-4 text-right font-medium tabular-nums">빈도</th>
                <th className="pb-2 pr-4 text-right font-medium tabular-nums">비율</th>
                <th className="pb-2 font-medium">분포</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {q.buckets.map((b) => {
                const isNoAnswer = b.label === NO_ANSWER_LABEL;
                const barPct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
                return (
                  <tr
                    key={b.key}
                    className={isNoAnswer ? "bg-amber-50/60" : undefined}
                  >
                    <td className="py-2.5 pr-4 align-middle">
                      <span
                        className={
                          isNoAnswer
                            ? "font-medium text-amber-900"
                            : "text-zinc-800"
                        }
                      >
                        {b.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right align-middle tabular-nums text-zinc-800">
                      {b.count.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-right align-middle tabular-nums text-zinc-600">
                      {b.percent}%
                    </td>
                    <td className="py-2.5 align-middle">
                      <div
                        className="h-2 overflow-hidden rounded-full bg-zinc-100"
                        role="presentation"
                      >
                        <div
                          className={`h-full rounded-full ${
                            isNoAnswer ? "bg-amber-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
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
