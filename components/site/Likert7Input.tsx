"use client";

import { useCallback, useRef, useState } from "react";
import {
  LIKERT_7_VALUES,
  isLikert7Value,
  likertEndpointLabels,
} from "@/lib/survey-types";

const DOT = "h-6 w-6";
const NUM_W = "w-6";

function valueFromClientX(clientX: number, track: HTMLElement | null): number | null {
  if (!track) return null;
  const rect = track.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const n = Math.round(t * (LIKERT_7_VALUES.length - 1)) + 1;
  return isLikert7Value(n) ? n : null;
}

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
  const trackRef = useRef<HTMLDivElement>(null);
  const dragActiveRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const { minLabel, maxLabel } = likertEndpointLabels(options.map((o) => o.label));

  const applyPointerX = useCallback(
    (clientX: number) => {
      const next = valueFromClientX(clientX, trackRef.current);
      if (next != null) onChange(next);
    },
    [onChange],
  );

  const endDrag = useCallback((target: HTMLElement, pointerId: number) => {
    dragActiveRef.current = false;
    setDragging(false);
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    dragActiveRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    applyPointerX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !dragActiveRef.current) return;
    applyPointerX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragActiveRef.current) return;
    endDrag(e.currentTarget, e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragActiveRef.current) return;
    endDrag(e.currentTarget, e.pointerId);
  };

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

      <div
        className="mt-2 overflow-x-auto pb-1"
        role="radiogroup"
        aria-label={`${prompt} — 1부터 7까지`}
      >
        <div className="mx-auto flex min-w-min flex-col items-center px-1">
          <div className="flex items-center">
            <span
              className="pointer-events-none pr-1 text-base font-light leading-none text-zinc-400"
              aria-hidden
            >
              [
            </span>
            <div
              ref={trackRef}
              className={`flex touch-none select-none items-center rounded-lg py-1 ${
              disabled
                ? "cursor-not-allowed opacity-60"
                : dragging
                  ? "cursor-grabbing"
                  : value != null
                    ? "cursor-grab"
                    : "cursor-pointer"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            >
              {LIKERT_7_VALUES.map((n, index) => {
              const selected = value === n;
              return (
                <span key={n} className="inline-flex items-center">
                  <label className="pointer-events-none flex flex-col items-center">
                    <input
                      type="radio"
                      name={`likert_${questionId}`}
                      value={n}
                      checked={selected}
                      disabled={disabled}
                      readOnly
                      tabIndex={-1}
                      className="sr-only"
                    />
                    <span
                      className={`flex ${DOT} items-center justify-center rounded-full border transition ${
                        selected
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-zinc-400 bg-white"
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`rounded-full transition-all ${
                          selected ? "h-1.5 w-1.5 bg-white" : "h-0 w-0"
                        }`}
                      />
                    </span>
                    <span className="sr-only">{n}점</span>
                  </label>
                  {index < LIKERT_7_VALUES.length - 1 ? (
                    <span
                      className="pointer-events-none mx-0.5 text-sm leading-none text-zinc-400 sm:mx-1"
                      aria-hidden
                    >
                      -
                    </span>
                  ) : null}
                </span>
              );
              })}

            </div>

            <span
              className="pointer-events-none pl-1 text-base font-light leading-none text-zinc-400"
              aria-hidden
            >
              ]
            </span>
          </div>

          <div className="pointer-events-none mt-1 flex items-center justify-center gap-0 px-5">
            {LIKERT_7_VALUES.map((n, index) => (
              <span
                key={`num-${n}`}
                className="inline-flex items-center text-[10px] font-medium tabular-nums text-zinc-500"
              >
                <span className={`flex ${NUM_W} justify-center`}>{n}</span>
                {index < LIKERT_7_VALUES.length - 1 ? (
                  <span className="mx-0.5 w-3 sm:mx-1" aria-hidden />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
