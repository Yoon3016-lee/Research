"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getKsicDetailAction,
  listKsicChildrenAction,
} from "@/app/actions/generate-survey-ai";
import { KsicDetailPanel } from "@/components/admin/KsicDetailPanel";
import { formatKsicHierarchyLabel } from "@/lib/ksic-display";
import type { KsicDetailPreview, KsicEntry } from "@/lib/ksic-types";
import { Loader2, Minus, Plus } from "lucide-react";

const ROOT_KEY = "__root__";

type Props = {
  selectedCode?: string;
  onSelect: (entry: KsicEntry) => void;
  /** 모달 내부용 — 좌 트리 / 우 상세 분할 */
  embedded?: boolean;
};

export function KsicHierarchyPicker({ selectedCode, onSelect, embedded = false }: Props) {
  const [roots, setRoots] = useState<KsicEntry[]>([]);
  const [childrenByParent, setChildrenByParent] = useState<Record<string, KsicEntry[]>>({});
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

  const focusEntry = useCallback((entry: KsicEntry) => {
    setFocusedCode(entry.code);
    setFocusedEntry(entry);
    setPreview(null);
    setPreviewLoading(true);
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
  }, []);

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
    const isApplied = selectedCode === entry.code;
    const isLoadingChildren = loadingKeys.has(entry.code);
    const children = childrenByParent[entry.code] ?? [];

    return (
      <li key={entry.code}>
        <div
          className={`flex items-stretch rounded-lg text-sm ${
            isFocused
              ? "bg-indigo-50 ring-1 ring-indigo-200"
              : isApplied
                ? "bg-zinc-100 ring-1 ring-zinc-200"
                : "hover:bg-zinc-50"
          }`}
          style={{ marginLeft: depth * 12 }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(entry)}
              className="flex w-9 shrink-0 items-center justify-center text-indigo-700 hover:bg-indigo-100/70"
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
            <span className="w-9 shrink-0" aria-hidden />
          )}
          <button
            type="button"
            onClick={() => focusEntry(entry)}
            className="min-w-0 flex-1 py-2.5 pr-3 text-left"
          >
            <span className="block break-words font-medium leading-snug text-zinc-900">
              {formatKsicHierarchyLabel(entry)}
            </span>
            <span className="mt-0.5 block break-words text-[11px] text-zinc-500">{entry.levelName}</span>
          </button>
        </div>
        {isExpanded && hasChildren ? (
          <ul className="mt-0.5 space-y-0.5 border-l border-zinc-200/90 pl-1">
            {isLoadingChildren && children.length === 0 ? (
              <li className="py-2 pl-8 text-xs text-zinc-500">불러오는 중…</li>
            ) : null}
            {children.map((child) => renderRow(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  const rootLoading = loadingKeys.has(ROOT_KEY) && roots.length === 0;

  const list = (
    <ul className="space-y-0.5 p-1">
      {rootLoading ? (
        <li className="flex items-center gap-2 px-3 py-8 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          대분류 불러오는 중…
        </li>
      ) : roots.length === 0 ? (
        <li className="px-3 py-8 text-center text-sm text-zinc-500">
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
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/30 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-200 lg:flex-[1.15] lg:border-b-0 lg:border-r">
          <div className="min-h-[min(48vh,520px)] flex-1 overflow-y-auto overscroll-contain lg:min-h-0">
            {list}
          </div>
          {loadError ? (
            <p className="shrink-0 border-t border-red-100 px-3 py-2 text-xs text-red-700">
              {loadError}
            </p>
          ) : null}
        </div>
        <div className="flex max-h-[min(38vh,340px)] w-full shrink-0 flex-col bg-white lg:max-h-none lg:min-h-0 lg:w-[min(440px,40%)]">
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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/40">
      <div className="border-b border-zinc-200 px-3 py-2 text-xs text-zinc-600">
        대분류부터 <strong className="font-medium text-zinc-800">+</strong>를 눌러 하위 분류를
        펼치고, 항목을 클릭해 내용을 확인한 뒤 선택하세요.
      </div>
      <div className="max-h-72 overflow-y-auto">{list}</div>
      {loadError ? (
        <p className="border-t border-red-100 px-3 py-2 text-xs text-red-700">{loadError}</p>
      ) : null}
    </div>
  );
}
