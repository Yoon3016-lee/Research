"use client";

import { likertEndpointLabels } from "@/lib/survey-types";
import { Likert7Track } from "@/components/site/Likert7Track";

type Props = {
  questionId: string;
  prompt: string;
  options: { id: string; label: string }[];
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
};

export function Likert7Input({
  questionId,
  prompt,
  options,
  value,
  disabled,
  onChange,
}: Props) {
  const { minLabel, maxLabel } = likertEndpointLabels(options.map((o) => o.label));
  const showDragHint = value != null && !disabled;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span className="max-w-[40%] text-left leading-snug">
          {minLabel ?? "1 (낮음)"}
        </span>
        <span className="max-w-[40%] text-right leading-snug">
          {maxLabel ?? "7 (높음)"}
        </span>
      </div>

      {showDragHint ? (
        <p className="mt-2 text-center text-[11px] text-zinc-500">
          선택 후 좌우로 드래그해 점수를 조절할 수 있습니다.
        </p>
      ) : null}

      <div className="mt-2 overflow-x-auto pb-1">
        <div className="mx-auto flex min-w-min flex-col items-center px-1">
          <Likert7Track
            namePrefix={`likert_${questionId}`}
            value={value}
            disabled={disabled}
            onChange={(v) => onChange(v)}
            ariaLabel={`${prompt} — 1부터 7까지`}
          />
        </div>
      </div>
    </div>
  );
}
