"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Sparkles } from "lucide-react";
import { useAxiSite } from "@/components/site/AxiSiteContext";
import { AxiGuidePanel } from "@/components/site/AxiGuidePanel";

const ICON_SIZE = 80;
const EDGE_GAP = 20;
const STORAGE_KEY = "research-a:axi-fab-pos";

type Pos = { x: number; y: number };

function clampPos(x: number, y: number): Pos {
  if (typeof window === "undefined") return { x, y };
  const maxX = Math.max(EDGE_GAP, window.innerWidth - ICON_SIZE - EDGE_GAP);
  const maxY = Math.max(EDGE_GAP, window.innerHeight - ICON_SIZE - EDGE_GAP);
  return {
    x: Math.min(maxX, Math.max(EDGE_GAP, x)),
    y: Math.min(maxY, Math.max(EDGE_GAP, y)),
  };
}

function defaultPos(): Pos {
  if (typeof window === "undefined") {
    return { x: 0, y: 200 };
  }
  return clampPos(window.innerWidth - ICON_SIZE - EDGE_GAP, window.innerHeight * 0.42);
}

function readStoredPos(): Pos | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pos;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
    return clampPos(parsed.x, parsed.y);
  } catch {
    return null;
  }
}

export function AxiFloatingLauncher() {
  const { axiIconUrl, page } = useAxiSite();
  const [pos, setPos] = useState<Pos>(defaultPos);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = readStoredPos();
    setPos(stored ?? defaultPos());
    setReady(true);
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const persist = useCallback((next: Pos) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      drag.moved = true;
    }
    if (drag.moved) {
      setPos(clampPos(drag.origX + dx, drag.origY + dy));
    }
  };

  const endDrag = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (drag.moved) {
      setPos((p) => {
        const next = clampPos(p.x, p.y);
        persist(next);
        return next;
      });
    } else {
      setOpen(true);
    }
    dragRef.current = null;
  };

  if (!ready) return null;

  return (
    <>
      {!open ? (
        <button
          ref={buttonRef}
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="fixed z-[160] flex h-20 w-20 touch-none items-center justify-center overflow-hidden rounded-full border-2 border-white bg-teal-600 text-white shadow-[0_10px_28px_-8px_rgba(13,148,136,0.55)] ring-1 ring-teal-900/10 transition hover:scale-[1.03] active:cursor-grabbing"
          style={{ left: pos.x, top: pos.y, cursor: "grab" }}
          aria-label="AXI 열기 (드래그하여 이동)"
          title="클릭: AXI 열기 · 드래그: 위치 이동"
        >
          {axiIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={axiIconUrl}
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
            />
          ) : (
            <Sparkles className="h-9 w-9" aria-hidden />
          )}
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed z-[170] flex max-h-[min(72vh,32rem)] w-[min(100vw-1.5rem,20rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
          style={{
            right: EDGE_GAP,
            bottom: EDGE_GAP,
            height: "min(72vh, 32rem)",
          }}
          role="dialog"
          aria-label="AXI"
        >
          <AxiGuidePanel
            mode={page.mode}
            surveyTitle={page.surveyTitle}
            scriptContext={page.scriptContext}
            ksicCode={page.ksicCode}
            ksicName={page.ksicName}
            axiIconUrl={axiIconUrl}
            onClose={() => setOpen(false)}
            embedded
          />
        </div>
      ) : null}
    </>
  );
}
