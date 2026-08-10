"use client";

import {
  clampLikertScaleSize,
  DEFAULT_LIKERT_SCALE_SIZE,
  isLikertScaleValue,
  likertScaleValues,
  normalizeLikertScaleLabels,
} from "@/lib/likert-scale";
import type { PublicSurveyOption } from "@/lib/survey-public";
import { LikertScaleTrack } from "@/components/site/Likert7Track";

type Props = {
  options: PublicSurveyOption[];
  scaleSize?: number | null;
  scaleLabels?: string[];
  values: Record<string, number | null>;
  disabled: boolean;
  onChange: (optionId: string, value: number) => void;
};

export function LikertMultiInput({
  options,
  scaleSize = DEFAULT_LIKERT_SCALE_SIZE,
  scaleLabels = [],
  values,
  disabled,
  onChange,
}: Props) {
  const size = clampLikertScaleSize(scaleSize);
  const labels = normalizeLikertScaleLabels(scaleLabels, size);
  const scaleValues = likertScaleValues(size);
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
            <th
              className="px-1 py-2 text-center font-normal"
              colSpan={scaleValues.length}
            >
              1 — {size} 척도
            </th>
          </tr>
          <tr className="border-b border-zinc-100 text-[10px] text-zinc-500">
            <th className="py-1 pr-3" />
            {labels.map((label, index) => (
              <th
                key={index}
                className="min-w-[2rem] max-w-[4.5rem] px-0.5 py-1 text-center font-normal leading-tight"
              >
                {label.trim() || index + 1}
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
              <td colSpan={scaleValues.length} className="py-2 pl-1">
                <LikertScaleTrack
                  namePrefix={`likert_multi_${opt.id}`}
                  scaleSize={size}
                  scaleLabels={labels}
                  value={values[opt.id] ?? null}
                  disabled={disabled}
                  onChange={(value) => onChange(opt.id, value)}
                  ariaLabel={`${opt.label} — 1부터 ${size}까지`}
                  showBracket={false}
                  showNumberRow={false}
                  compact
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
  scaleSize = DEFAULT_LIKERT_SCALE_SIZE,
): Record<string, number> {
  const size = clampLikertScaleSize(scaleSize);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(record)) {
    if (v != null && isLikertScaleValue(v, size)) out[k] = v;
  }
  return out;
}
