"use client";

import type { PublicSurveyOption } from "@/lib/survey-public";

type Props = {
  options: PublicSurveyOption[];
  rankCount: number;
  rankedOptionIds: string[];
  disabled: boolean;
  onChange: (rankedOptionIds: string[]) => void;
};

export function RankSelectInput({
  options,
  rankCount,
  rankedOptionIds,
  disabled,
  onChange,
}: Props) {
  const rankOf = (optionId: string) => rankedOptionIds.indexOf(optionId) + 1;

  const toggle = (optionId: string) => {
    if (disabled) return;
    const idx = rankedOptionIds.indexOf(optionId);
    if (idx >= 0) {
      onChange(rankedOptionIds.filter((id) => id !== optionId));
      return;
    }
    if (rankedOptionIds.length >= rankCount) return;
    onChange([...rankedOptionIds, optionId]);
  };

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-zinc-500">
        선택지를 누른 순서대로 1~{rankCount}순위가 지정됩니다. 다시 누르면 순위에서
        제외됩니다.
      </p>
      <ul className="space-y-2">
        {options.map((opt, optIndex) => {
          const rank = rankOf(opt.id);
          const selected = rank > 0;
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={disabled || (!selected && rankedOptionIds.length >= rankCount)}
                onClick={() => toggle(opt.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? "border-indigo-300 bg-indigo-50 text-indigo-950"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-indigo-200 hover:bg-indigo-50/40 disabled:opacity-50"
                }`}
              >
                <span className="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-zinc-500">
                  {optIndex + 1}.
                </span>
                <span className="min-w-0 flex-1">{opt.label}</span>
                {selected ? (
                  <span className="shrink-0 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {rank}순위
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-zinc-400">선택</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs tabular-nums text-zinc-500">
        선택됨 {rankedOptionIds.length} / {rankCount}
      </p>
    </div>
  );
}
