"use client";

import { useCallback, useRef, useState } from "react";
import { LIKERT_7_VALUES, isLikert7Value } from "@/lib/survey-types";

const DOT = "h-6 w-6";
const NUM_W = "w-6";

export function likert7ValueFromClientX(
  clientX: number,
  track: HTMLElement | null,
): number | null {
  if (!track) return null;
  const rect = track.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const n = Math.round(t * (LIKERT_7_VALUES.length - 1)) + 1;
  return isLikert7Value(n) ? n : null;
}

type Likert7TrackProps = {
  namePrefix: string;
  value: number | null;
  disabled: boolean;
  onChange: (value: number) => void;
  ariaLabel: string;
  showBracket?: boolean;
  showNumberRow?: boolean;
};

export function Likert7Track({
  namePrefix,
  value,
  disabled,
  onChange,
  ariaLabel,
  showBracket = true,
  showNumberRow = true,
}: Likert7TrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragActiveRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const applyPointerX = useCallback(
    (clientX: number) => {
      const next = likert7ValueFromClientX(clientX, trackRef.current);
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

  return (
    <div role="radiogroup" aria-label={ariaLabel}>
      <div className="flex items-center">
        {showBracket ? (
          <span
            className="pointer-events-none pr-1 text-base font-light leading-none text-zinc-400"
            aria-hidden
          >
            [
          </span>
        ) : null}
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
                    name={namePrefix}
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
        {showBracket ? (
          <span
            className="pointer-events-none pl-1 text-base font-light leading-none text-zinc-400"
            aria-hidden
          >
            ]
          </span>
        ) : null}
      </div>

      {showNumberRow ? (
        <div
          className={`pointer-events-none mt-1 flex items-center justify-center gap-0 tabular-nums text-[10px] font-medium text-zinc-500 ${
            showBracket ? "px-5" : ""
          }`}
        >
          {LIKERT_7_VALUES.map((n, index) => (
            <span key={`num-${n}`} className="inline-flex items-center">
              <span className={`flex ${NUM_W} justify-center`}>{n}</span>
              {index < LIKERT_7_VALUES.length - 1 ? (
                <span className="mx-0.5 w-3 sm:mx-1" aria-hidden />
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
