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
  /** 다중척도: 상단 열과 동일한 등분 그리드(대시 없음) */
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
  /** 일반 리커트만 넓게 — ①+라벨이 한 줄로 나오도록 (다중척도 compact는 유지) */
  const colClass = compact
    ? "min-w-0"
    : size > 7
      ? "w-[4.75rem] sm:w-[5.5rem]"
      : "w-[5.75rem] sm:w-[6.75rem]";

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

  const cursorClass = disabled
    ? "cursor-not-allowed opacity-60"
    : dragging
      ? "cursor-grabbing"
      : value != null
        ? "cursor-grab"
        : "cursor-pointer";

  const renderPoint = (n: number, index: number) => {
    const selected = value === n;
    const pointLabel = displayLikertPointLabel(index, labels);
    const hasCustomLabel = Boolean(labels[index]?.trim());
    return (
      <label
        className={`pointer-events-none relative z-[1] flex ${colClass} flex-col items-center px-0.5`}
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
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition sm:h-9 sm:w-9 ${
            selected
              ? "border-indigo-600 bg-indigo-600"
              : "border-zinc-400 bg-white"
          }`}
          aria-hidden
        >
          <span
            className={`rounded-full transition-all ${
              selected ? "h-2 w-2 bg-white" : "h-0 w-0"
            }`}
          />
        </span>
        {showNumberRow ? (
          <span
            className={`mt-2 w-full text-center leading-snug text-zinc-700 ${
              compact
                ? hasCustomLabel
                  ? "px-0.5 text-[11px] font-medium sm:text-xs"
                  : "text-xs font-semibold tabular-nums"
                : hasCustomLabel
                  ? "whitespace-nowrap px-0.5 text-[11px] font-medium sm:text-xs"
                  : "whitespace-nowrap text-xs font-semibold tabular-nums"
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
    );
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel}>
      <div className={`flex items-start ${compact ? "w-full" : "justify-center"}`}>
        {showBracket && !compact ? (
          <span
            className="pointer-events-none mt-2 pr-1.5 text-lg font-light leading-none text-zinc-400"
            aria-hidden
          >
            [
          </span>
        ) : null}

        {compact ? (
          <div
            ref={trackRef}
            className={`relative grid w-full touch-none select-none items-start py-1 ${cursorClass}`}
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <span
              className="pointer-events-none absolute left-[8%] right-[8%] top-4 h-0.5 -translate-y-1/2 bg-zinc-300 sm:top-[1.125rem]"
              aria-hidden
            />
            {values.map((n, index) => (
              <div key={n} className="flex justify-center">
                {renderPoint(n, index)}
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={trackRef}
            className={`flex touch-none select-none items-start rounded-lg py-1 ${cursorClass}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            {values.map((n, index) => (
              <Fragment key={n}>
                {renderPoint(n, index)}
                {index < values.length - 1 ? (
                  <span
                    className="pointer-events-none mt-2 shrink-0 px-2 text-base leading-none text-zinc-400 sm:px-3"
                    aria-hidden
                  >
                    -
                  </span>
                ) : null}
              </Fragment>
            ))}
          </div>
        )}

        {showBracket && !compact ? (
          <span
            className="pointer-events-none mt-2 pl-1.5 text-lg font-light leading-none text-zinc-400"
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
