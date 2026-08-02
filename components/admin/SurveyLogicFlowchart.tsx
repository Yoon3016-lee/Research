import type { LogicQuestionRow, SurveyLogicModel } from "@/lib/survey-logic-view";
import { GitBranch, Users, ArrowDown, Circle } from "lucide-react";

type Props = {
  model: SurveyLogicModel;
};

function FlowConnector({ tall = false }: { tall?: boolean }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <div className={`w-0.5 bg-zinc-300 ${tall ? "h-10" : "h-6"}`} />
      <ArrowDown className="h-4 w-4 text-zinc-400" strokeWidth={2.5} />
    </div>
  );
}

function FlowStartEnd({ label, variant }: { label: string; variant: "start" | "end" }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
        variant === "start"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border border-zinc-200 bg-zinc-100 text-zinc-700"
      }`}
    >
      <Circle className="h-2 w-2 fill-current" aria-hidden />
      {label}
    </div>
  );
}

function nodeStyle(q: LogicQuestionRow): string {
  if (q.staffOnly && q.visibilityMode === "conditional") {
    return "border-2 border-dashed border-indigo-300 bg-indigo-50/80 ring-2 ring-fuchsia-100";
  }
  if (q.staffOnly) {
    return "border-2 border-indigo-300 bg-indigo-50/90";
  }
  if (q.visibilityMode === "conditional") {
    return "border-2 border-dashed border-fuchsia-300 bg-fuchsia-50/50";
  }
  return "border-2 border-zinc-200 bg-white";
}

function MiniQuestionCard({ q }: { q: LogicQuestionRow }) {
  return (
    <div
      className={`w-full max-w-[11rem] rounded-xl px-3 py-2.5 text-center shadow-sm ${nodeStyle(q)}`}
    >
      <p className="text-[11px] font-bold text-fuchsia-800">문항 {q.number}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-800">{q.prompt}</p>
    </div>
  );
}

function FlowQuestionCard({ q }: { q: LogicQuestionRow }) {
  return (
    <div className={`relative w-full max-w-md rounded-2xl px-5 py-4 shadow-md ${nodeStyle(q)}`}>
      <div className="absolute -left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-xs font-bold text-white shadow">
        {q.number}
      </div>

      <div className="pl-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
            {q.typeLabel}
          </span>
          {q.staffOnly ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-200/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-950">
              <Users className="h-2.5 w-2.5" aria-hidden />
              직원 전용
            </span>
          ) : null}
          {q.visibilityMode === "conditional" ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-fuchsia-200/80 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-950">
              <GitBranch className="h-2.5 w-2.5" aria-hidden />
              조건부
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
              항상 표시
            </span>
          )}
        </div>

        <p className="mt-2 text-sm font-medium leading-snug text-zinc-900">{q.prompt}</p>

        {q.linkedBranches.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {q.linkedBranches.map((b) => (
              <span
                key={b.optionIndex}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                  b.endsSurvey
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-amber-200 bg-amber-50 text-amber-950"
                }`}
              >
                {b.optionLabel}
                {b.endsSurvey ? " → 종료" : ""}
              </span>
            ))}
          </div>
        ) : null}

        {q.visibilityMode === "conditional" ? (
          <div className="mt-3 space-y-1 rounded-lg border border-fuchsia-100 bg-white/80 px-3 py-2">
            {q.visibilityConditions.map((c, i) => (
              <p key={i} className="text-[11px] leading-relaxed text-fuchsia-900">
                {i > 0 ? (
                  <span className="mr-1 font-semibold text-fuchsia-700">또는</span>
                ) : null}
                문항 {c.sourceNumber} 「{c.optionLabel}」 선택 시
              </p>
            ))}
          </div>
        ) : null}

        {q.staffOnly ? (
          <p className="mt-2 text-[11px] text-indigo-800/90">게스트에게는 숨김</p>
        ) : null}
      </div>
    </div>
  );
}

function BranchQuestionNode({
  q,
  questionsByNumber,
}: {
  q: LogicQuestionRow;
  questionsByNumber: Map<number, LogicQuestionRow>;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <MiniQuestionCard q={q} />
      {q.linkedBranches.length > 0 ? (
        <FlowBranchFork
          linkedBranches={q.linkedBranches}
          questionsByNumber={questionsByNumber}
          nested
        />
      ) : null}
    </div>
  );
}

function FlowBranchFork({
  linkedBranches,
  questionsByNumber,
  nested = false,
}: {
  linkedBranches: SurveyLogicModel["branches"];
  questionsByNumber: Map<number, LogicQuestionRow>;
  nested?: boolean;
}) {
  if (linkedBranches.length === 0) return null;

  const colCount = linkedBranches.length;
  const forkWidth = nested
    ? Math.min(colCount * 120, 320)
    : Math.min(colCount * 160, 560);

  return (
    <div className={`w-full ${nested ? "max-w-xs" : "max-w-3xl"} px-1`}>
      {!nested ? (
        <div className="flex flex-col items-center" aria-hidden>
          <div className="h-4 w-0.5 bg-fuchsia-300" />
          <div className="h-0.5 bg-fuchsia-300" style={{ width: `${forkWidth}px` }} />
        </div>
      ) : null}

      <div
        className={`grid items-start gap-x-3 ${nested ? "mt-2" : "mt-1"}`}
        style={{
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
        }}
      >
        {linkedBranches.map((b) => (
          <div
            key={`${b.sourceNumber}-${b.optionIndex}`}
            className="flex min-w-0 flex-col items-center self-start"
          >
            <div className="rounded-full border-2 border-fuchsia-300 bg-fuchsia-100 px-3 py-1.5 text-center text-xs font-bold text-fuchsia-950 shadow-sm sm:text-sm">
              {b.optionLabel}
            </div>
            <div className="my-2 flex flex-col items-center" aria-hidden>
              <div className="h-5 w-0.5 bg-fuchsia-300" />
              <ArrowDown className="h-3.5 w-3.5 text-fuchsia-400" />
            </div>
            <div className="flex w-full flex-col items-stretch gap-2">
              {b.endsSurvey ? (
                <div className="mx-auto rounded-full border-2 border-amber-300 bg-amber-50 px-3 py-1.5 text-center text-[11px] font-bold text-amber-950 shadow-sm">
                  조사 종료
                </div>
              ) : null}
              {b.targetNumbers.map((n) => {
                const tq = questionsByNumber.get(n);
                return tq ? (
                  <BranchQuestionNode key={n} q={tq} questionsByNumber={questionsByNumber} />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>

      {!nested ? (
        <div className="mt-3 flex flex-col items-center" aria-hidden>
          <div className="h-0.5 bg-zinc-300" style={{ width: `${forkWidth}px` }} />
          <div className="h-4 w-0.5 bg-zinc-300" />
          <ArrowDown className="h-4 w-4 text-zinc-400" />
        </div>
      ) : null}
    </div>
  );
}

export function SurveyLogicFlowchart({ model }: Props) {
  const questionsByNumber = new Map(model.questions.map((q) => [q.number, q]));
  const spineQuestions = model.questions.filter((q) => q.showOnSpine);

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-6 sm:p-10">
      <div className="mx-auto flex min-w-[280px] max-w-3xl flex-col items-center">
        <FlowStartEnd label="설문 시작" variant="start" />
        <FlowConnector />

        {spineQuestions.map((q, index) => {
          const hasFork = q.linkedBranches.length > 0;

          return (
            <div key={q.number} className="flex w-full flex-col items-center">
              <FlowQuestionCard q={q} />

              {hasFork ? (
                <FlowBranchFork
                  linkedBranches={q.linkedBranches}
                  questionsByNumber={questionsByNumber}
                />
              ) : index < spineQuestions.length - 1 ? (
                <FlowConnector tall={q.visibilityMode === "conditional"} />
              ) : null}

              {hasFork && index < spineQuestions.length - 1 ? (
                <FlowConnector />
              ) : null}
            </div>
          );
        })}

        <FlowConnector />
        <FlowStartEnd label="제출" variant="end" />
      </div>
    </div>
  );
}
