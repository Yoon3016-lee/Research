"use client";

import { useEffect } from "react";
import { KsicHierarchyPicker } from "@/components/admin/KsicHierarchyPicker";
import type { KsicEntry } from "@/lib/ksic-types";
import { FolderTree, X } from "lucide-react";

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
      className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-900/50 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ksic-hierarchy-dialog-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(92vh,900px)] w-[min(98vw,1200px)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <div className="min-w-0">
            <h2
              id="ksic-hierarchy-dialog-title"
              className="flex items-center gap-2 text-base font-semibold text-zinc-900"
            >
              <FolderTree className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
              KSIC 분류표
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              <strong className="font-medium text-zinc-700">+</strong>로 하위 분류를 펼치고, 항목을
              클릭하면 오른쪽에 분류 내용이 표시됩니다. 확인 후{" "}
              <strong className="font-medium text-zinc-700">이 분류 선택</strong>을 눌러 적용하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="닫기"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
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
