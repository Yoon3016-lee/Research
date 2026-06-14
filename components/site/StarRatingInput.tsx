"use client";

import { Star } from "lucide-react";
import { isStarRatingValue } from "@/lib/survey-types";

const STAR_COUNT = 5;

/** i번째 별(1~5) 클릭 시 순환: (i-1) → (i-0.5) → i → (i-1) */
function nextValueForStar(starIndex: number, current: number | null): number {
  const cycle = [starIndex - 1, starIndex - 0.5, starIndex];
  if (current === cycle[2]) return cycle[0];
  if (current === cycle[1]) return cycle[2];
  if (current === cycle[0]) return cycle[1];
  return cycle[0];
}

function starFillState(starIndex: number, value: number | null): "empty" | "half" | "full" {
  if (value == null || !isStarRatingValue(value)) return "empty";
  if (value >= starIndex) return "full";
  if (value >= starIndex - 0.5) return "half";
  return "empty";
}

type Props = {
  value: number | null;
  disabled: boolean;
  onChange: (value: number) => void;
};

export function StarRatingInput({ value, disabled, onChange }: Props) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-zinc-500">
        별을 누를 때마다 0.5점 단위로 올라갑니다. 최대 점수에서 다시 누르면 한 단계
        내려갑니다.
      </p>
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={`별점 ${value != null ? `${value}점` : "미선택"}`}
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const starIndex = i + 1;
          const fill = starFillState(starIndex, value);
          return (
            <button
              key={starIndex}
              type="button"
              disabled={disabled}
              aria-label={`${starIndex}번째 별`}
              aria-pressed={fill !== "empty"}
              onClick={() => onChange(nextValueForStar(starIndex, value))}
              className="relative rounded p-0.5 text-amber-400 transition hover:scale-105 disabled:opacity-50"
            >
              <Star
                className={`h-9 w-9 stroke-amber-500 ${
                  fill === "full"
                    ? "fill-amber-400 text-amber-400"
                    : fill === "half"
                      ? "fill-amber-200 text-amber-400"
                      : "fill-none text-zinc-300"
                }`}
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
          );
        })}
        <span className="ml-2 text-sm font-medium tabular-nums text-zinc-700">
          {value != null && isStarRatingValue(value) ? `${value}점` : "—"}
        </span>
      </div>
    </div>
  );
}
