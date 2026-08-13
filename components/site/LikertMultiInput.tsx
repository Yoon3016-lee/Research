"use client";

import {
  clampLikertScaleSize,
  DEFAULT_LIKERT_SCALE_SIZE,
  displayLikertPointLabel,
  isLikertScaleValue,
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
  const hasAnyValue = options.some((opt) => values[opt.id] != null);

  /** 항목열 + 척도 N열 — 헤더·행 트랙이 같은 폭으로 맞도록 */
  const gridTemplateColumns = `minmax(8rem, 13rem) repeat(${size}, minmax(3.25rem, 1fr))`;

  return (
    <div className="mt-4 overflow-x-auto">
      {hasAnyValue && !disabled ? (
        <p className="mb-3 text-center text-[11px] text-zinc-500">
          항목을 선택한 뒤 좌우로 드래그해 점수를 조절할 수 있습니다.
        </p>
      ) : null}

      <div className="min-w-[36rem] space-y-0">
        <div
          className="grid items-end gap-0 border-b border-zinc-200 pb-2"
          style={{ gridTemplateColumns }}
        >
          <div className="pr-3 text-left text-xs font-medium text-zinc-500">항목</div>
          {labels.map((_, index) => (
            <div
              key={index}
              className="px-0.5 text-center text-[11px] font-medium leading-snug text-zinc-600 sm:text-xs"
            >
              {displayLikertPointLabel(index, labels)}
            </div>
          ))}
        </div>

        {options.map((opt) => (
          <div
            key={opt.id}
            className="grid items-center gap-0 border-b border-zinc-100 py-3 last:border-0"
            style={{ gridTemplateColumns }}
          >
            <div className="pr-3 text-left text-sm font-medium text-zinc-800">
              {opt.label}
            </div>
            <div
              className="min-w-0"
              style={{ gridColumn: `2 / span ${size}` }}
            >
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
            </div>
          </div>
        ))}
      </div>
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
