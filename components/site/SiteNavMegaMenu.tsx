"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { SiteNavGroup } from "@/lib/site-homepage";
import { scrollToPrimeaxSectionWhenReady } from "@/lib/primeax-public-chrome";

type Props = {
  groups: SiteNavGroup[];
};

type DropdownPos = {
  top: number;
  left: number;
  minWidth: number;
};

const CLOSE_DELAY_MS = 150;

function hrefPathname(href: string): string {
  const path = href.trim().split(/[?#]/)[0];
  return path || "/";
}

function hrefHash(href: string): string | null {
  const trimmed = href.trim();
  const hashIndex = trimmed.indexOf("#");
  if (hashIndex < 0) return null;
  const hash = trimmed.slice(hashIndex + 1).split("?")[0]?.trim();
  return hash || null;
}

function isHomeSectionHref(href: string): boolean {
  const path = hrefPathname(href);
  return (path === "/" || path === "") && Boolean(hrefHash(href));
}

function isHrefActive(pathname: string, href: string): boolean {
  if (isHomeSectionHref(href)) {
    if (pathname !== "/") return false;
    if (typeof window === "undefined") return false;
    return window.location.hash === `#${hrefHash(href)}`;
  }
  const path = hrefPathname(href);
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isInquiryCta(group: SiteNavGroup): boolean {
  const href = group.href.trim().toLowerCase();
  const label = group.label.toUpperCase();
  return (
    group.key === "inquiry" ||
    href.startsWith("/inquiry") ||
    label.includes("PROJECT INQUIRY") ||
    label.includes("문의")
  );
}

function useNavHrefHandler() {
  const pathname = usePathname();
  const router = useRouter();

  return useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!isHomeSectionHref(href)) return;
      e.preventDefault();
      const hash = hrefHash(href);
      if (!hash) return;
      const target = `/#${hash}`;
      if (pathname === "/") {
        scrollToPrimeaxSectionWhenReady(hash);
        window.history.replaceState(null, "", target);
        window.dispatchEvent(new Event("hashchange"));
        return;
      }
      router.push(target);
    },
    [pathname, router],
  );
}

export function SiteNavMegaMenu({ groups }: Props) {
  const pathname = usePathname();
  const onNavHref = useNavHrefHandler();
  const navRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const [, setHashTick] = useState(0);

  useEffect(() => {
    const sync = () => setHashTick((n) => n + 1);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const isGroupActive = (group: SiteNavGroup) => {
    if (group.href.trim() && isHrefActive(pathname, group.href)) return true;
    return group.items.some((item) => isHrefActive(pathname, item.href));
  };

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
    }
    closeTimerRef.current = null;
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
  const activeIsDirectLink = Boolean(activeGroup?.href.trim());

  const panel =
    activeGroup && dropdownPos && !activeIsDirectLink ? (
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
                const itemActive = isHrefActive(pathname, item.href);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        onNavHref(e, item.href);
                        setActiveKey(null);
                      }}
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

  const tabClass = (active: boolean, isActiveKey: boolean) =>
    `whitespace-nowrap rounded-t-md border-b-[3px] px-2.5 py-2.5 text-center text-[0.72rem] font-extrabold tracking-tight transition sm:px-3.5 sm:text-[0.8rem] lg:text-[0.88rem] ${
      active
        ? "border-brand-900 text-brand-900"
        : isActiveKey
          ? "border-brand-900/40 text-brand-900"
          : "border-transparent text-brand-800 hover:border-brand-900/30 hover:text-brand-900"
    }`;

  const inquiryClass =
    "inline-flex items-center gap-1 rounded-md border border-[#88b9ef] bg-[rgba(242,248,255,0.74)] px-2.5 py-1.5 text-[0.65rem] font-bold tracking-wide text-[#104788] transition hover:border-[#1767dc] hover:bg-white sm:text-[0.7rem]";

  return (
    <>
      <div
        ref={navRef}
        className="flex flex-wrap items-end justify-center gap-x-1 gap-y-1 sm:gap-x-2"
        onMouseLeave={scheduleClose}
      >
        {groups.map((group) => {
          const active = isGroupActive(group);
          const isActiveKey = activeKey === group.key;
          const directHref = group.href.trim();
          const inquiry = isInquiryCta(group);

          if (directHref) {
            return (
              <div
                key={group.key}
                ref={(el) => setColumnRef(group.key, el)}
                className="shrink-0 self-center"
                onMouseEnter={() => {
                  cancelClose();
                  setActiveKey(null);
                }}
              >
                <Link
                  href={directHref}
                  onClick={(e) => onNavHref(e, directHref)}
                  className={inquiry ? inquiryClass : `block ${tabClass(active, false)}`}
                >
                  {group.label}
                  {inquiry && !group.label.includes("↗") ? (
                    <span className="text-[#ff5a32]" aria-hidden>
                      ↗
                    </span>
                  ) : null}
                </Link>
              </div>
            );
          }

          return (
            <div
              key={group.key}
              ref={(el) => setColumnRef(group.key, el)}
              className="shrink-0"
              onMouseEnter={() => openGroup(group.key)}
            >
              <button
                type="button"
                onFocus={() => openGroup(group.key)}
                className={tabClass(active, isActiveKey)}
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
