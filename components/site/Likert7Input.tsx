"use client";

import {
  clampLikertScaleSize,
  DEFAULT_LIKERT_SCALE_SIZE,
  normalizeLikertScaleLabels,
} from "@/lib/likert-scale";
import { LikertScaleTrack } from "@/components/site/Likert7Track";

type Props = {
  questionId: string;
  prompt: string;
  scaleSize?: number | null;
  scaleLabels?: string[];
  value: number | null;
  disabled: boolean;
  allowSkip?: boolean;
  onChange: (value: number | null) => void;
};

export function Likert7Input({
  questionId,
  prompt,
  scaleSize = DEFAULT_LIKERT_SCALE_SIZE,
  scaleLabels = [],
  value,
  disabled,
  allowSkip = false,
  onChange,
}: Props) {
  const size = clampLikertScaleSize(scaleSize);
  const labels = normalizeLikertScaleLabels(scaleLabels, size);
  const showHint = value != null && !disabled;

  return (
    <div className="mt-4">
      {showHint ? (
        <p className="mb-2 text-center text-[11px] text-zinc-500">
          {allowSkip
            ? "선택한 점수를 다시 누르면 해제됩니다. 좌우로 드래그해 점수를 조절할 수 있습니다."
            : "선택 후 좌우로 드래그해 점수를 조절할 수 있습니다."}
        </p>
      ) : null}

      <div className="overflow-x-auto pb-1">
        <div className="mx-auto flex min-w-min flex-col items-center px-1">
          <LikertScaleTrack
            namePrefix={`likert_${questionId}`}
            scaleSize={size}
            scaleLabels={labels}
            value={value}
            disabled={disabled}
            allowSkip={allowSkip}
            onChange={onChange}
            ariaLabel={`${prompt} — 1부터 ${size}까지`}
          />
        </div>
      </div>
    </div>
  );
}
