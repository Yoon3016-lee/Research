"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SiteNavGroup } from "@/lib/site-homepage";

type Props = {
  groups: SiteNavGroup[];
};

type DropdownPos = {
  top: number;
  left: number;
  minWidth: number;
};

const CLOSE_DELAY_MS = 150;

export function SiteNavMegaMenu({ groups }: Props) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);

  const isGroupActive = (group: SiteNavGroup) =>
    group.items.some(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

  const computeDropdown = useCallback((key: string) => {
    const header = navRef.current?.closest("header");
    const col = columnRefs.current.get(key);
    if (!header || !col) return;

    const headerRect = header.getBoundingClientRect();
    const rect = col.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 224);
    const maxLeft = window.innerWidth - minWidth - 12;
    const left = Math.max(12, Math.min(rect.left, maxLeft));
    setDropdownPos({ top: headerRect.bottom, left, minWidth });
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openGroup = useCallback(
    (key: string) => {
      cancelClose();
      setActiveKey(key);
      requestAnimationFrame(() => computeDropdown(key));
    },
    [cancelClose, computeDropdown],
  );

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setActiveKey(null);
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
    if (!activeKey) return;
    computeDropdown(activeKey);
    const onScrollOrResize = () => computeDropdown(activeKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [activeKey, computeDropdown]);

  useEffect(() => {
    if (!activeKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveKey(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeKey]);

  const activeGroup = activeKey
    ? (groups.find((g) => g.key === activeKey) ?? null)
    : null;

  const panel =
    activeGroup && dropdownPos ? (
      <div
        id="site-nav-mega-panel"
        role="navigation"
        aria-label={`${activeGroup.label} 하위 메뉴`}
        className="fixed z-[200] overflow-hidden rounded-b-xl border border-t-0 border-brand-900/10 bg-white/98 shadow-[0_20px_44px_-16px_rgba(15,23,42,0.24)] backdrop-blur-md"
        style={{
          top: dropdownPos.top,
          left: dropdownPos.left,
          minWidth: dropdownPos.minWidth,
        }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="p-2">
          {activeGroup.items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-brand-700/60">등록된 메뉴가 없습니다.</p>
          ) : (
            <ul className="space-y-0.5">
              {activeGroup.items.map((item) => {
                const itemActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setActiveKey(null)}
                      className={`block whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition ${
                        itemActive
                          ? "bg-brand-900/8 font-semibold text-brand-900"
                          : "font-medium text-brand-800 hover:bg-brand-900/5"
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
        onMouseLeave={scheduleClose}
      >
        {groups.map((group) => {
          const active = isGroupActive(group);
          const isActiveKey = activeKey === group.key;
          return (
            <div
              key={group.key}
              ref={(el) => setColumnRef(group.key, el)}
              onMouseEnter={() => openGroup(group.key)}
            >
              <button
                type="button"
                onFocus={() => openGroup(group.key)}
                className={`whitespace-nowrap rounded-t-md border-b-[3px] px-3 py-2.5 text-left text-[1.5rem] font-bold tracking-tight transition sm:px-5 sm:text-[1.625rem] ${
                  active
                    ? "border-brand-900 text-brand-900"
                    : isActiveKey
                      ? "border-brand-900/40 text-brand-900"
                      : "border-transparent text-brand-800 hover:border-brand-900/30 hover:text-brand-900"
                }`}
                aria-expanded={isActiveKey}
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
