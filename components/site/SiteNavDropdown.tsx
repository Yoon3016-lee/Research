"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SiteNavGroup } from "@/lib/site-homepage";

type Props = {
  group: SiteNavGroup;
};

type MenuPos = { top: number; left: number; minWidth: number };

export function SiteNavDropdown({ group }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const isActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const updateMenuPosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.max(rect.width, 176),
    });
  };

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const portal = document.getElementById(`nav-menu-${group.key}`);
      if (portal?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, group.key]);

  const menuPanel =
    open && menuPos ? (
      <div
        id={`nav-menu-${group.key}`}
        role="menu"
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          minWidth: menuPos.minWidth,
        }}
        className="z-[200] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
      >
        {group.items.length === 0 ? (
          <p className="px-3 py-2 text-xs text-zinc-500">등록된 메뉴가 없습니다.</p>
        ) : (
          group.items.map((item) => {
            const itemActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm ${
                  itemActive
                    ? "bg-indigo-50 font-medium text-indigo-900"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })
        )}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) {
              requestAnimationFrame(() => updateMenuPosition());
            }
            return next;
          });
        }}
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive || open
            ? "bg-indigo-50 text-indigo-900"
            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {group.label}
        {group.items.length > 0 ? (
          <span className="sr-only">({group.items.length}개 하위 메뉴)</span>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 opacity-70 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {typeof document !== "undefined" && menuPanel
        ? createPortal(menuPanel, document.body)
        : null}
    </div>
  );
}
