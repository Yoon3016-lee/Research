"use client";

import { useEffect } from "react";
import { KsicHierarchyPicker } from "@/components/admin/KsicHierarchyPicker";
import type { KsicEntry } from "@/lib/ksic-types";
import { FolderTree, Sparkles, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedCode?: string;
  onSelect: (entry: KsicEntry) => void;
  /** 열 때마다 트리를 처음(대분류)부터 다시 로드 */
  resetKey: number;
};

export function KsicHierarchyDialog({
  open,
  onClose,
  selectedCode,
  onSelect,
  resetKey,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (entry: KsicEntry) => {
    onSelect(entry);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-950/30 p-2 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ksic-hierarchy-dialog-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(92vh,900px)] w-[min(98vw,1200px)] flex-col overflow-hidden rounded-2xl border border-sky-200/90 bg-gradient-to-b from-sky-50 via-white to-sky-50/40 shadow-2xl shadow-sky-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-sky-200/80 bg-gradient-to-r from-sky-100/90 via-sky-50 to-white px-4 py-3.5">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-sky-300/25 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="ksic-hierarchy-dialog-title"
                className="flex items-center gap-2 text-base font-semibold text-sky-950"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700">
                  <FolderTree className="h-4 w-4 shrink-0" aria-hidden />
                </span>
                KSIC 분류표
              </h2>
              <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-sky-900/70">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
                <span>
                  <strong className="font-semibold text-sky-800">+</strong>로 하위 분류를 펼치고 항목을
                  클릭하면 오른쪽에 상세 내용이 표시됩니다. 확인 후{" "}
                  <strong className="font-semibold text-sky-800">이 분류 선택</strong>으로 적용하세요.
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-sky-200/80 bg-white/80 p-1.5 text-sky-700/80 shadow-sm transition hover:bg-white hover:text-sky-900"
              aria-label="닫기"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
          <KsicHierarchyPicker
            key={resetKey}
            embedded
            selectedCode={selectedCode}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
