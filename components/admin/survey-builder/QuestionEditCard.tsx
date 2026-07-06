"use client";

import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import {
  QUESTION_TYPE_LABELS,
  type DraftQuestion,
  type QuestionType,
} from "@/lib/survey-types";
import {
  isBranchingSourceType,
  SURVEY_BRANCHING_SOURCE_RULE,
  SURVEY_BRANCHING_SOURCE_RULE_DETAIL,
  type QuestionVisibilityCondition,
} from "@/lib/survey-visibility";

type Props = {
  q: DraftQuestion;
  index: number;
  total: number;
  allQuestions: DraftQuestion[];
  onChange: (patch: Partial<DraftQuestion>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

const TYPE_BADGE: Record<QuestionType, string> = {
  mc_single: "bg-violet-100 text-violet-900 ring-violet-200",
  mc_multi: "bg-violet-100 text-violet-900 ring-violet-200",
  dropdown: "bg-violet-100 text-violet-900 ring-violet-200",
  rank: "bg-amber-100 text-amber-900 ring-amber-200",
  text_single: "bg-sky-100 text-sky-900 ring-sky-200",
  text_multi: "bg-sky-100 text-sky-900 ring-sky-200",
  likert_7: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  likert_multi: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  star_rating: "bg-amber-100 text-amber-900 ring-amber-200",
};

export function QuestionEditCard({
  q,
  index,
  total,
  allQuestions,
  onChange,
  onMove,
  onRemove,
}: Props) {
  const priorBranching = allQuestions
    .map((pq, pi) => ({ pq, pi }))
    .filter(({ pi, pq }) => pi < index && isBranchingSourceType(pq.type));

  const conditional = q.visibilityRules.length > 0;

  const conditionSummary =
    [
      q.allowSkip ? "무응답 허용" : null,
      q.staffOnly ? "직원 전용" : null,
      conditional ? "조건부 표시" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "기본";

  const sourceOptionLabels = (sourceOrderIndex: number): string[] => {
    const source = allQuestions[sourceOrderIndex];
    if (!source) return [];
    return source.options.map((o) => o.trim()).filter(Boolean);
  };

  const setConditionalMode = (enabled: boolean) => {
    if (!enabled) {
      onChange({ visibilityRules: [] });
      return;
    }
    if (q.visibilityRules.length > 0) return;
    const first = priorBranching[0];
    if (!first) return;
    onChange({
      visibilityRules: [{ sourceOrderIndex: first.pi, optionIndex: 0 }],
    });
  };

  const updateRule = (
    ruleIndex: number,
    patch: Partial<QuestionVisibilityCondition>,
  ) => {
    const next = q.visibilityRules.map((r, i) =>
      i === ruleIndex ? { ...r, ...patch } : r,
    );
    onChange({ visibilityRules: next });
  };

  const addRule = () => {
    const first = priorBranching[0];
    if (!first) return;
    onChange({
      visibilityRules: [
        ...q.visibilityRules,
        { sourceOrderIndex: first.pi, optionIndex: 0 },
      ],
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <GripVertical
            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300"
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">
                문항 {index + 1}
              </span>
              <span
                className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${TYPE_BADGE[q.type]}`}
              >
                {QUESTION_TYPE_LABELS[q.type]}
              </span>
              {q.allowSkip ? (
                <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200">
                  무응답 허용
                </span>
              ) : null}
              {q.staffOnly ? (
                <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-900 ring-1 ring-indigo-200">
                  직원 전용
                </span>
              ) : null}
              {conditional ? (
                <span className="inline-flex rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-medium text-fuchsia-900 ring-1 ring-fuchsia-200">
                  조건부 표시
                </span>
              ) : null}
              {isBranchingSourceType(q.type) ? (
                <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800 ring-1 ring-violet-200">
                  분기 기준 가능
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              유형을 바꾸려면 이 문항을 삭제한 뒤, 문항 추가 패널에서 다시
              넣어 주세요.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-25"
            aria-label="위로 이동"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-25"
            aria-label="아래로 이동"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
            aria-label="문항 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">질문 *</span>
          <textarea
            required
            value={q.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            placeholder="응답자에게 보여질 질문을 입력하세요."
          />
        </label>

        <details className="group rounded-xl border border-zinc-200 bg-zinc-50/30">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-zinc-800 select-none [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-2">
              <ChevronRight
                className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-90"
                aria-hidden
              />
              조건 설정
            </span>
            <span className="truncate text-xs font-normal text-zinc-500">{conditionSummary}</span>
          </summary>
          <div className="space-y-3 border-t border-zinc-100 px-3 pb-3 pt-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 transition hover:bg-zinc-50/80">
              <input
                type="checkbox"
                checked={q.allowSkip}
                onChange={(e) => onChange({ allowSkip: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <span className="text-sm font-medium text-zinc-800">무응답 허용</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                  체크하면 이 문항을 비우고 다음으로 넘어갈 수 있습니다.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-3 py-2.5 transition hover:bg-indigo-50/70">
              <input
                type="checkbox"
                checked={q.staffOnly}
                onChange={(e) => onChange({ staffOnly: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <span className="text-sm font-medium text-zinc-800">직원에게만 표시</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                  로그인한 직원(employee 이상)에게만 이 문항이 보입니다. 게스트·비로그인
                  참여자에게는 숨겨집니다.
                </span>
              </span>
            </label>

            <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/30 p-3">
              <span className="text-sm font-medium text-zinc-800">표시 조건</span>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                {SURVEY_BRANCHING_SOURCE_RULE} {SURVEY_BRANCHING_SOURCE_RULE_DETAIL}
                조건이 여러 개이면 모두 만족할 때 표시됩니다.
              </p>
              {priorBranching.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  앞쪽에 객관식(단일 선택) 또는 드롭다운 문항이 있어야 조건을 설정할 수 있습니다.
                </p>
              ) : (
                <>
                  <label className="mt-3 block text-sm">
                    <span className="font-medium text-zinc-700">모드</span>
                    <select
                      value={conditional ? "conditional" : "always"}
                      onChange={(e) => setConditionalMode(e.target.value === "conditional")}
                      className="mt-1.5 w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="always">항상 표시</option>
                      <option value="conditional">이전 답변에 따라 표시</option>
                    </select>
                  </label>
                  {conditional ? (
                    <div className="mt-3 space-y-3">
                      {q.visibilityRules.map((rule, ri) => {
                        const labels = sourceOptionLabels(rule.sourceOrderIndex);
                        return (
                          <div
                            key={ri}
                            className="flex flex-wrap items-end gap-2 rounded-lg border border-fuchsia-100 bg-white p-3"
                          >
                            <label className="min-w-[10rem] flex-1 text-xs">
                              <span className="font-medium text-zinc-700">기준 문항</span>
                              <select
                                value={rule.sourceOrderIndex}
                                onChange={(e) => {
                                  const sourceOrderIndex = Number(e.target.value);
                                  updateRule(ri, { sourceOrderIndex, optionIndex: 0 });
                                }}
                                className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                              >
                                {priorBranching.map(({ pq, pi }) => (
                                  <option key={pi} value={pi}>
                                    문항 {pi + 1}
                                    {pq.prompt.trim()
                                      ? ` — ${pq.prompt.trim().slice(0, 40)}`
                                      : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="min-w-[10rem] flex-1 text-xs">
                              <span className="font-medium text-zinc-700">선택한 보기</span>
                              <select
                                value={rule.optionIndex}
                                onChange={(e) =>
                                  updateRule(ri, { optionIndex: Number(e.target.value) })
                                }
                                className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                              >
                                {labels.map((label, oi) => (
                                  <option key={oi} value={oi}>
                                    보기 {oi + 1}
                                    {label ? ` — ${label.slice(0, 40)}` : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                            {q.visibilityRules.length > 1 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    visibilityRules: q.visibilityRules.filter((_, i) => i !== ri),
                                  })
                                }
                                className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                조건 삭제
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addRule}
                        className="text-xs font-medium text-fuchsia-800 hover:text-fuchsia-950"
                      >
                        + 조건 추가 (AND)
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </details>

        {(q.type === "mc_single" || q.type === "mc_multi" || q.type === "dropdown") && (
          <div className="rounded-xl border border-zinc-100 bg-white p-3">
            <span className="text-sm font-medium text-zinc-800">선택지</span>
            <p className="mt-0.5 text-xs text-zinc-500">
              {q.type === "dropdown"
                ? "드롭다운에 표시할 보기입니다. 최소 2개 이상 채워 주세요."
                : "응답자에게 보일 보기 문구입니다. 최소 2개 이상 채워 주세요."}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => (
                <input
                  key={oi}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...q.options];
                    opts[oi] = e.target.value;
                    onChange({ options: opts });
                  }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                  placeholder={`보기 ${oi + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onChange({ options: [...q.options, ""] })}
              className="mt-2 text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              + 보기 추가
            </button>
            {q.type === "mc_multi" && (
              <label className="mt-4 block border-t border-zinc-100 pt-3">
                <span className="text-sm font-medium text-zinc-800">
                  최대 선택 개수
                </span>
                <p className="text-xs text-zinc-500">
                  응답자가 동시에 고를 수 있는 보기의 최대 개수입니다.
                </p>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, q.options.filter((x) => x.trim()).length)}
                  value={q.maxSelections}
                  onChange={(e) =>
                    onChange({
                      maxSelections: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="mt-2 w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
                <span className="ml-2 text-xs text-zinc-400">
                  (최대 {q.options.filter((x) => x.trim()).length || 0}개)
                </span>
              </label>
            )}
          </div>
        )}

        {q.type === "rank" && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <span className="text-sm font-medium text-zinc-800">순위 선택 설정</span>
            <p className="mt-0.5 text-xs text-zinc-500">
              응답자가 고를 선택지와, 몇 순위까지 매길지 설정합니다.
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => (
                <input
                  key={oi}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...q.options];
                    opts[oi] = e.target.value;
                    onChange({ options: opts });
                  }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                  placeholder={`선택지 ${oi + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onChange({ options: [...q.options, ""] })}
              className="mt-2 text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              + 선택지 추가
            </button>
            <label className="mt-4 block border-t border-amber-100 pt-3">
              <span className="text-sm font-medium text-zinc-800">순위 개수</span>
              <p className="text-xs text-zinc-500">
                예: 5개 선택지 중 3순위까지 → 3
              </p>
              <input
                type="number"
                min={1}
                max={Math.max(1, q.options.filter((x) => x.trim()).length)}
                value={q.maxSelections}
                onChange={(e) =>
                  onChange({
                    maxSelections: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="mt-2 w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        {q.type === "likert_multi" && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <p className="text-sm font-medium text-zinc-800">척도 평가 항목</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              한 문항 안에서 각각 1~7 척도로 평가할 항목입니다. (예: 교육 만족도,
              교육 친절도)
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => (
                <input
                  key={oi}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...q.options];
                    opts[oi] = e.target.value;
                    onChange({ options: opts });
                  }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                  placeholder={`항목 ${oi + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onChange({ options: [...q.options, ""] })}
              className="mt-2 text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              + 항목 추가
            </button>
          </div>
        )}

        {q.type === "star_rating" && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <p className="text-sm font-medium text-zinc-800">별점 평가 (1~5점)</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              별 5개 · 0.5점 단위. 같은 별을 반복 클릭하면 0.5점씩 올라가고, 최대
              점수에서 다시 누르면 한 단계 내려갑니다.
            </p>
          </div>
        )}

        {q.type === "likert_7" && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <p className="text-sm font-medium text-zinc-800">1~7 리커트 척도</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              응답자는 1(낮음)부터 7(높음) 중 하나를 선택합니다. 양끝 설명은
              선택 사항입니다.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-zinc-700">1점 라벨 (선택)</span>
                <input
                  value={q.options[0] ?? ""}
                  onChange={(e) => {
                    const opts = [...(q.options.length >= 2 ? q.options : ["", ""])];
                    opts[0] = e.target.value;
                    onChange({ options: opts });
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="예: 전혀 그렇지 않다"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-700">7점 라벨 (선택)</span>
                <input
                  value={q.options[1] ?? ""}
                  onChange={(e) => {
                    const opts = [...(q.options.length >= 2 ? q.options : ["", ""])];
                    opts[1] = e.target.value;
                    onChange({ options: opts });
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="예: 매우 그렇다"
                />
              </label>
            </div>
          </div>
        )}

        {q.type === "text_multi" && (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4">
            <p className="text-sm font-medium text-zinc-900">답변 입력 줄</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              동일 질문에 대해 여러 칸으로 나누어 받을 때 사용합니다. 최소 2줄
              이상입니다.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm tabular-nums text-zinc-800">
                현재 <strong>{q.textLineCount}</strong>줄
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({ textLineCount: q.textLineCount + 1 })
                }
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                줄 추가
              </button>
              {q.textLineCount > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      textLineCount: Math.max(2, q.textLineCount - 1),
                    })
                  }
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                >
                  한 줄 제거
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
