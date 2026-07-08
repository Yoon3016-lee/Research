"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getKsicDetailAction,
  listKsicChildrenAction,
} from "@/app/actions/generate-survey-ai";
import { KsicDetailPanel } from "@/components/admin/KsicDetailPanel";
import { formatKsicHierarchyLabel } from "@/lib/ksic-display";
import type { KsicDetailPreview, KsicEntry } from "@/lib/ksic-types";
import { Check, ChevronRight, Loader2, Minus, Plus } from "lucide-react";

const ROOT_KEY = "__root__";

type Props = {
  selectedCode?: string;
  onSelect: (entry: KsicEntry) => void;
  /** 모달 내부용 — 좌 트리 / 우 상세 분할 */
  embedded?: boolean;
};

function buildPathCodes(code: string, parentByCode: Record<string, string>): string[] {
  const path: string[] = [];
  let current: string | undefined = code;
  while (current) {
    path.unshift(current);
    current = parentByCode[current];
  }
  return path;
}

export function KsicHierarchyPicker({ selectedCode, onSelect, embedded = false }: Props) {
  const [roots, setRoots] = useState<KsicEntry[]>([]);
  const [childrenByParent, setChildrenByParent] = useState<Record<string, KsicEntry[]>>({});
  const [parentByCode, setParentByCode] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set([ROOT_KEY]));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [focusedEntry, setFocusedEntry] = useState<KsicEntry | null>(null);
  const [preview, setPreview] = useState<KsicDetailPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [, startTransition] = useTransition();

  const loadChildren = useCallback((parentCode: string | null) => {
    const key = parentCode ?? ROOT_KEY;
    setLoadingKeys((prev) => new Set(prev).add(key));
    setLoadError(null);
    startTransition(async () => {
      try {
        const items = await listKsicChildrenAction(parentCode);
        if (parentCode === null) {
          setRoots(items);
        } else {
          setChildrenByParent((prev) => ({ ...prev, [parentCode]: items }));
          setParentByCode((prev) => {
            const next = { ...prev };
            for (const item of items) {
              next[item.code] = parentCode;
            }
            return next;
          });
        }
      } catch {
        setLoadError("분류 목록을 불러오지 못했습니다.");
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    });
  }, []);

  useEffect(() => {
    loadChildren(null);
  }, [loadChildren]);

  const ensureAncestorsExpanded = useCallback(
    (code: string) => {
      const ancestors = buildPathCodes(code, parentByCode).slice(0, -1);
      for (const ancestor of ancestors) {
        setExpanded((prev) => {
          if (prev.has(ancestor)) return prev;
          const next = new Set(prev);
          next.add(ancestor);
          return next;
        });
        if (!childrenByParent[ancestor]) {
          loadChildren(ancestor);
        }
      }
    },
    [childrenByParent, loadChildren, parentByCode],
  );

  const focusEntry = useCallback(
    (entry: KsicEntry) => {
      setFocusedCode(entry.code);
      setFocusedEntry(entry);
      setPreview(null);
      setPreviewLoading(true);
      ensureAncestorsExpanded(entry.code);
      startTransition(async () => {
        try {
          const detail = await getKsicDetailAction(entry.code);
          setPreview(detail);
        } catch {
          setPreview(null);
        } finally {
          setPreviewLoading(false);
        }
      });
    },
    [ensureAncestorsExpanded],
  );

  const toggleExpand = (entry: KsicEntry) => {
    if (entry.childCount <= 0) return;
    if (expanded.has(entry.code)) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(entry.code);
        return next;
      });
      return;
    }
    setExpanded((prev) => new Set(prev).add(entry.code));
    if (!childrenByParent[entry.code]) {
      loadChildren(entry.code);
    }
  };

  const renderRow = (entry: KsicEntry, depth: number) => {
    const hasChildren = entry.childCount > 0;
    const isExpanded = expanded.has(entry.code);
    const isFocused = focusedCode === entry.code;
    const isApplied = selectedCode === entry.code && !isFocused;
    const isLoadingChildren = loadingKeys.has(entry.code);
    const children = childrenByParent[entry.code] ?? [];

    let rowClass =
      "group relative flex items-stretch rounded-xl text-sm transition-all duration-150 ";
    if (isFocused) {
      rowClass +=
        "bg-gradient-to-r from-sky-200/90 to-sky-100/70 shadow-md shadow-sky-200/50 ring-1 ring-sky-400/40";
    } else if (isApplied) {
      rowClass += "bg-sky-50/60 ring-1 ring-sky-100";
    } else {
      rowClass += "hover:bg-sky-50/80";
    }

    return (
      <li key={entry.code}>
        <div className={rowClass} style={{ marginLeft: depth * 10 }}>
          {isFocused ? (
            <span
              className="absolute bottom-1 top-1 w-1 rounded-full bg-sky-500"
              style={{ left: -2 }}
              aria-hidden
            />
          ) : null}

          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(entry)}
              className="flex w-9 shrink-0 items-center justify-center rounded-l-xl text-sky-700 transition hover:bg-sky-200/50"
              aria-expanded={isExpanded}
              aria-label={`${entry.name} 하위 분류 ${isExpanded ? "접기" : "펼치기"}`}
            >
              {isLoadingChildren ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : isExpanded ? (
                <Minus className="h-4 w-4" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
            </button>
          ) : (
            <span className="flex w-9 shrink-0 items-center justify-center text-sky-300/80">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}

          <button
            type="button"
            onClick={() => focusEntry(entry)}
            className="flex min-w-0 flex-1 items-start gap-2 py-2.5 pr-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span
                className={`block break-words font-medium leading-snug ${
                  isFocused
                    ? "text-sky-950"
                    : isApplied
                      ? "text-sky-800"
                      : "text-slate-800 group-hover:text-sky-900"
                }`}
              >
                {formatKsicHierarchyLabel(entry)}
              </span>
              <span
                className={`mt-0.5 block break-words text-[11px] ${
                  isFocused ? "text-sky-700/80" : "text-slate-500"
                }`}
              >
                {entry.levelName}
              </span>
            </span>
            {isFocused ? (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white">
                <Check className="h-3 w-3" aria-hidden />
              </span>
            ) : null}
          </button>
        </div>
        {isExpanded && hasChildren ? (
          <ul className="mt-0.5 space-y-0.5 border-l-2 border-sky-200/70 pl-1.5">
            {isLoadingChildren && children.length === 0 ? (
              <li className="py-2 pl-8 text-xs text-sky-700/70">불러오는 중…</li>
            ) : null}
            {children.map((child) => renderRow(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  const rootLoading = loadingKeys.has(ROOT_KEY) && roots.length === 0;

  const list = (
    <ul className="space-y-1 p-2">
      {rootLoading ? (
        <li className="flex items-center gap-2 px-3 py-10 text-sm text-sky-800/70">
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" aria-hidden />
          대분류 불러오는 중…
        </li>
      ) : roots.length === 0 ? (
        <li className="px-3 py-10 text-center text-sm text-sky-800/70">
          표시할 분류가 없습니다.
          <br />
          <span className="text-xs">KSIC DB import(`npm run db:import-ksic`)를 확인하세요.</span>
        </li>
      ) : (
        roots.map((entry) => renderRow(entry, 0))
      )}
    </ul>
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-100/40 via-sky-50/30 to-white shadow-inner shadow-sky-100/50 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-sky-200/70 lg:flex-[1.15] lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-sky-100/90 bg-sky-100/40 px-3 py-2">
            <p className="text-[11px] font-medium text-sky-800/80">
              항목을 클릭하면 오른쪽에 분류 내용이 표시됩니다.
            </p>
          </div>
          <div className="min-h-[min(48vh,520px)] flex-1 overflow-y-auto overscroll-contain lg:min-h-0">
            {list}
          </div>
          {loadError ? (
            <p className="shrink-0 border-t border-red-100 bg-red-50/80 px-3 py-2 text-xs text-red-700">
              {loadError}
            </p>
          ) : null}
        </div>
        <div className="flex max-h-[min(38vh,340px)] w-full shrink-0 flex-col overflow-hidden rounded-b-xl lg:max-h-none lg:min-h-0 lg:w-[min(440px,40%)] lg:rounded-none lg:rounded-r-xl">
          <KsicDetailPanel
            preview={preview}
            loading={previewLoading}
            focusedEntry={focusedEntry}
            onSelect={onSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200/80 bg-gradient-to-b from-sky-50/60 to-white">
      <div className="border-b border-sky-100 px-3 py-2 text-xs text-sky-800/75">
        대분류부터 <strong className="font-semibold text-sky-900">+</strong>를 눌러 하위 분류를
        펼치고, 항목을 클릭해 내용을 확인한 뒤 선택하세요.
      </div>
      <div className="max-h-72 overflow-y-auto">{list}</div>
      {loadError ? (
        <p className="border-t border-red-100 bg-red-50/80 px-3 py-2 text-xs text-red-700">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
