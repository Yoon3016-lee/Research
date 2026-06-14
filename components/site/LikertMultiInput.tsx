"use client";

import { LIKERT_7_VALUES, isLikert7Value } from "@/lib/survey-types";
import type { PublicSurveyOption } from "@/lib/survey-public";
import { Likert7Track } from "@/components/site/Likert7Track";

type Props = {
  options: PublicSurveyOption[];
  values: Record<string, number | null>;
  disabled: boolean;
  onChange: (optionId: string, value: number) => void;
};

export function LikertMultiInput({ options, values, disabled, onChange }: Props) {
  const hasAnyValue = options.some((opt) => values[opt.id] != null);

  return (
    <div className="mt-4 overflow-x-auto">
      {hasAnyValue && !disabled ? (
        <p className="mb-3 text-center text-[11px] text-zinc-500">
          항목을 선택한 뒤 좌우로 드래그해 점수를 조절할 수 있습니다.
        </p>
      ) : null}
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs text-zinc-500">
            <th className="py-2 pr-3 text-left font-medium">항목</th>
            <th className="px-1 py-2 text-center font-normal" colSpan={LIKERT_7_VALUES.length}>
              1 (낮음) — 7 (높음)
            </th>
          </tr>
          <tr className="border-b border-zinc-100 text-[10px] tabular-nums text-zinc-400">
            <th className="py-1 pr-3" />
            {LIKERT_7_VALUES.map((n) => (
              <th key={n} className="w-8 px-0.5 py-1 text-center font-normal">
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {options.map((opt) => (
            <tr key={opt.id} className="border-b border-zinc-100 last:border-0">
              <th
                scope="row"
                className="min-w-[8rem] py-3 pr-3 text-left align-middle font-medium text-zinc-800"
              >
                {opt.label}
              </th>
              <td colSpan={LIKERT_7_VALUES.length} className="py-2 pl-1">
                <Likert7Track
                  namePrefix={`likert_multi_${opt.id}`}
                  value={values[opt.id] ?? null}
                  disabled={disabled}
                  onChange={(value) => onChange(opt.id, value)}
                  ariaLabel={`${opt.label} — 1부터 7까지`}
                  showBracket={false}
                  showNumberRow={false}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function likertMultiValuesFromRecord(
  record: Record<string, number | null>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(record)) {
    if (v != null && isLikert7Value(v)) out[k] = v;
  }
  return out;
}
