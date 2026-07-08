"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminSectionTab = {
  id: string;
  label: string;
};

type Props = {
  tabs: AdminSectionTab[];
  defaultTabId: string;
  children: (activeTabId: string) => React.ReactNode;
};

function tabIdFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("tab")?.trim();
  if (fromQuery) return fromQuery;

  const hash = window.location.hash.slice(1);
  if (hash.startsWith("section-")) {
    return hash.slice("section-".length);
  }
  return null;
}

export function AdminSectionTabPanel({ tabs, defaultTabId, children }: Props) {
  const validIds = tabs.map((t) => t.id);
  const [activeId, setActiveId] = useState(defaultTabId);

  const applyTab = useCallback(
    (id: string, updateUrl = true) => {
      if (!validIds.includes(id)) return;
      setActiveId(id);
      if (updateUrl && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", id);
        url.hash = `section-${id}`;
        window.history.replaceState(null, "", url.toString());
      }
    },
    [validIds],
  );

  useEffect(() => {
    const fromLocation = tabIdFromLocation();
    if (fromLocation && validIds.includes(fromLocation)) {
      applyTab(fromLocation, false);
      return;
    }
    applyTab(defaultTabId, false);
  }, [applyTab, defaultTabId, validIds]);

  useEffect(() => {
    const onHashChange = () => {
      const fromLocation = tabIdFromLocation();
      if (fromLocation && validIds.includes(fromLocation)) {
        setActiveId(fromLocation);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [validIds]);

  if (tabs.length <= 1) {
    return <div>{children(activeId)}</div>;
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="섹션 탭"
        className="flex flex-wrap gap-2 rounded-xl border border-brand-900/8 bg-surface/60 p-2"
        role="tablist"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              onClick={() => applyTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-white text-brand-900 shadow-sm ring-1 ring-brand-900/8"
                  : "text-brand-700 hover:bg-white/80 hover:text-brand-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div
        role="tabpanel"
        id={`panel-${activeId}`}
        aria-labelledby={`tab-${activeId}`}
      >
        {children(activeId)}
      </div>
    </div>
  );
}
