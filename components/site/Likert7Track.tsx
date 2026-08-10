"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import {
  clampLikertScaleSize,
  displayLikertPointLabel,
  likertScaleValues,
  likertValueFromClientX,
  normalizeLikertScaleLabels,
} from "@/lib/likert-scale";

type LikertScaleTrackProps = {
  namePrefix: string;
  scaleSize: number;
  scaleLabels?: string[];
  value: number | null;
  disabled: boolean;
  onChange: (value: number) => void;
  ariaLabel: string;
  showBracket?: boolean;
  showNumberRow?: boolean;
  /** 다중척도 테이블 등 좁은 칸 */
  compact?: boolean;
};

export function LikertScaleTrack({
  namePrefix,
  scaleSize,
  scaleLabels = [],
  value,
  disabled,
  onChange,
  ariaLabel,
  showBracket = true,
  showNumberRow = true,
  compact = false,
}: LikertScaleTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragActiveRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const size = clampLikertScaleSize(scaleSize);
  const labels = normalizeLikertScaleLabels(scaleLabels, size);
  const values = likertScaleValues(size);
  const colClass = compact
    ? "min-w-[2rem] max-w-[4.5rem] flex-1"
    : size > 7
      ? "w-7 sm:w-8"
      : "w-8 sm:w-9";

  const applyPointerX = useCallback(
    (clientX: number) => {
      const next = likertValueFromClientX(clientX, trackRef.current, size);
      if (next != null) onChange(next);
    },
    [onChange, size],
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
      <div className="flex items-start justify-center">
        {showBracket ? (
          <span
            className="pointer-events-none mt-[0.35rem] pr-1 text-base font-light leading-none text-zinc-400"
            aria-hidden
          >
            [
          </span>
        ) : null}

        <div
          ref={trackRef}
          className={`flex touch-none select-none items-start rounded-lg py-1 ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : dragging
                ? "cursor-grabbing"
                : value != null
                  ? "cursor-grab"
                  : "cursor-pointer"
          } ${compact ? "w-full min-w-0" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {values.map((n, index) => {
            const selected = value === n;
            const pointLabel = displayLikertPointLabel(index, labels);
            const hasCustomLabel = Boolean(labels[index]?.trim());
            return (
              <Fragment key={n}>
                <label
                  className={`pointer-events-none flex ${colClass} flex-col items-center px-0.5`}
                >
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
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
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
                  {showNumberRow ? (
                    <span
                      className={`mt-1.5 text-center leading-tight text-zinc-600 ${
                        hasCustomLabel
                          ? "max-w-full text-[10px] font-medium"
                          : "text-[11px] font-medium tabular-nums"
                      }`}
                    >
                      {pointLabel}
                    </span>
                  ) : (
                    <span className="sr-only">{pointLabel}</span>
                  )}
                  {showNumberRow ? (
                    <span className="sr-only">
                      {n}점{hasCustomLabel ? ` (${labels[index]})` : ""}
                    </span>
                  ) : null}
                </label>
                {index < values.length - 1 ? (
                  <span
                    className="pointer-events-none mt-[0.35rem] shrink-0 px-0.5 text-sm leading-none text-zinc-400 sm:px-1"
                    aria-hidden
                  >
                    -
                  </span>
                ) : null}
              </Fragment>
            );
          })}
        </div>

        {showBracket ? (
          <span
            className="pointer-events-none mt-[0.35rem] pl-1 text-base font-light leading-none text-zinc-400"
            aria-hidden
          >
            ]
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated LikertScaleTrack 사용 */
export const Likert7Track = LikertScaleTrack;

/** @deprecated likertValueFromClientX 사용 */
export function likert7ValueFromClientX(
  clientX: number,
  track: HTMLElement | null,
  scaleSize = 7,
): number | null {
  return likertValueFromClientX(clientX, track, scaleSize);
}
