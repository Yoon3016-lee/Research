import type { SurveyLogicModel } from "@/lib/survey-logic-view";
import { SurveyLogicFlowchart } from "@/components/admin/SurveyLogicFlowchart";

type Props = {
  model: SurveyLogicModel;
};

export function SurveyLogicViewer({ model }: Props) {
  if (model.questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
        문항이 없어 로직을 표시할 수 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-zinc-200 bg-white" aria-hidden />
            항상 표시
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded border-2 border-dashed border-fuchsia-300 bg-fuchsia-50"
              aria-hidden
            />
            조건부 표시
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-indigo-300 bg-indigo-50" aria-hidden />
            직원 전용
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-fuchsia-100 ring-2 ring-fuchsia-300" aria-hidden />
            분기 보기
          </span>
        </div>
        <div className="flex gap-3 text-sm tabular-nums text-zinc-600">
          <span>
            전체 <strong className="text-zinc-900">{model.questions.length}</strong>
          </span>
          <span>
            조건부{" "}
            <strong className="text-fuchsia-800">
              {model.questions.filter((q) => q.visibilityMode === "conditional").length}
            </strong>
          </span>
          <span>
            직원 전용{" "}
            <strong className="text-indigo-800">
              {model.questions.filter((q) => q.staffOnly).length}
            </strong>
          </span>
        </div>
      </div>

      {!model.hasAnyLogic ? (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          분기·직원 전용 설정이 없습니다. 아래 흐름도는 위에서 아래로 순서대로 진행됩니다.
        </p>
      ) : (
        <p className="text-sm text-zinc-600">
          위에서 아래로 설문이 진행됩니다. 객관식·드롭다운 문항 아래에서 보기별로 갈라지는
          분기를 확인할 수 있습니다.
        </p>
      )}

      <SurveyLogicFlowchart model={model} />
    </div>
  );
}
