"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SiteNavGroup } from "@/lib/site-homepage";

type Props = {
  groups: SiteNavGroup[];
};

type ColumnPos = { left: number; width: number };

type PanelLayout = {
  top: number;
  left: number;
  width: number;
};

const CLOSE_DELAY_MS = 150;

export function SiteNavMegaMenu({ groups }: Props) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [panelLayout, setPanelLayout] = useState<PanelLayout | null>(null);
  const [columnPos, setColumnPos] = useState<Map<string, ColumnPos>>(new Map());

  const isGroupActive = (group: SiteNavGroup) =>
    group.items.some(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

  const updateLayout = useCallback(() => {
    const header = navRef.current?.closest("header");
    const band = header?.querySelector(".site-content-band");
    if (!header || !(band instanceof HTMLElement)) return;

    const headerRect = header.getBoundingClientRect();
    const bandRect = band.getBoundingClientRect();
    setPanelLayout({
      top: headerRect.bottom,
      left: bandRect.left,
      width: bandRect.width,
    });

    const next = new Map<string, ColumnPos>();
    for (const group of groups) {
      const col = columnRefs.current.get(group.key);
      if (!col) continue;
      const rect = col.getBoundingClientRect();
      next.set(group.key, {
        left: rect.left - bandRect.left,
        width: rect.width,
      });
    }
    setColumnPos(next);
  }, [groups]);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPanel = useCallback(() => {
    cancelClose();
    setOpen(true);
    requestAnimationFrame(() => updateLayout());
  }, [cancelClose, updateLayout]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setHoveredKey(null);
    }, CLOSE_DELAY_MS);
  }, [cancelClose]);

  const setColumnRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) columnRefs.current.set(key, el);
    else columnRefs.current.delete(key);
  }, []);

  useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  useEffect(() => {
    if (!open) return;
    updateLayout();
    const onScrollOrResize = () => updateLayout();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updateLayout]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setHoveredKey(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const maxItemCount = Math.max(...groups.map((g) => Math.max(g.items.length, 1)), 1);
  const panelMinHeight = 16 + maxItemCount * 40 + 8;

  const panel =
    open && panelLayout && columnPos.size > 0 ? (
      <div
        id="site-nav-mega-panel"
        role="navigation"
        aria-label="전체 하위 메뉴"
        className="fixed z-[200] overflow-hidden border-b border-brand-900/10 bg-white/98 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18)] backdrop-blur-md"
        style={{
          top: panelLayout.top,
          left: panelLayout.left,
          width: panelLayout.width,
        }}
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
      >
        <div className="relative py-3" style={{ minHeight: panelMinHeight }}>
          {groups.map((group) => {
            const pos = columnPos.get(group.key);
            if (!pos) return null;

            const groupActive = isGroupActive(group);
            const columnHighlighted =
              hoveredKey === group.key || (!hoveredKey && groupActive);

            return (
              <div
                key={group.key}
                className={`absolute top-3 box-border rounded-xl py-1 pl-2 pr-1 transition-all duration-150 sm:pl-3 ${
                  columnHighlighted
                    ? "bg-accent-500/10 ring-1 ring-inset ring-accent-500/25"
                    : "opacity-40"
                }`}
                style={{
                  left: pos.left,
                  width: pos.width,
                }}
                onMouseEnter={() => setHoveredKey(group.key)}
              >
                {group.items.length === 0 ? (
                  <p
                    className={`text-sm ${
                      columnHighlighted ? "font-medium text-brand-800" : "text-brand-700/60"
                    }`}
                  >
                    등록된 메뉴가 없습니다.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const itemActive =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => {
                              setOpen(false);
                              setHoveredKey(null);
                            }}
                            className={`block rounded-lg py-2 pr-2 text-left text-sm transition ${
                              itemActive
                                ? "bg-brand-900/8 font-semibold text-brand-900"
                                : columnHighlighted
                                  ? "font-medium text-brand-800 hover:bg-brand-900/5"
                                  : "text-brand-700/70 hover:bg-brand-900/5 hover:text-brand-900"
                            }`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div
        ref={navRef}
        className="grid gap-0.5 sm:gap-1"
        style={{
          gridTemplateColumns: `repeat(${groups.length}, minmax(7.5rem, max-content))`,
        }}
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
      >
        {groups.map((group) => {
          const active = isGroupActive(group);
          const highlighted = open && (hoveredKey === group.key || (!hoveredKey && active));
          return (
            <div
              key={group.key}
              ref={(el) => setColumnRef(group.key, el)}
              onMouseEnter={() => setHoveredKey(group.key)}
            >
              <button
                type="button"
                onFocus={openPanel}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-[1.0625rem] font-medium transition sm:px-4 ${
                  highlighted || (open && active)
                    ? "bg-brand-900/6 text-brand-900 ring-1 ring-brand-900/10"
                    : open
                      ? "text-brand-700 hover:bg-brand-900/5 hover:text-brand-900"
                      : active
                        ? "bg-brand-900/6 text-brand-900"
                        : "text-brand-700 hover:bg-brand-900/5 hover:text-brand-900"
                }`}
                aria-expanded={open}
                aria-controls="site-nav-mega-panel"
              >
                {group.label}
              </button>
            </div>
          );
        })}
      </div>

      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
