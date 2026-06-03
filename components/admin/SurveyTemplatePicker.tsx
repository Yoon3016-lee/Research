"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileStack, Loader2, X } from "lucide-react";
import { loadSurveyTemplateAction } from "@/app/actions/survey-template";
import type { DraftQuestion } from "@/lib/survey-types";
import type { AdminSurveyRow } from "@/lib/survey-list-types";

export type SurveyTemplatePickerSurvey = Pick<AdminSurveyRow, "id" | "title" | "status">;

type Props = {
  surveys: SurveyTemplatePickerSurvey[];
  /** 편집 중인 설문 slug — 목록에서 제외 */
  excludeSlug?: string;
  open: boolean;
  onClose: () => void;
  /**
   * navigate: 새 설문 만들기 페이지로 이동 (?template=slug)
   * apply: 문항만 폼에 반영 (onApply 호출)
   */
  mode: "navigate" | "apply";
  onApply?: (payload: {
    questions: DraftQuestion[];
    sourceTitle: string;
    sourceSlug: string;
  }) => void;
};

export function SurveyTemplatePicker({
  surveys,
  excludeSlug,
  open,
  onClose,
  mode,
  onApply,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return surveys
      .filter((s) => s.id !== excludeSlug)
      .filter(
        (s) =>
          !q ||
          s.title.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
  }, [surveys, excludeSlug, query]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!selectedSlug) {
      setError("템플릿으로 사용할 설문을 선택하세요.");
      return;
    }
    setError(null);

    if (mode === "navigate") {
      onClose();
      router.push(
        `/admin/surveys/new?template=${encodeURIComponent(selectedSlug)}`,
      );
      return;
    }

    startTransition(async () => {
      const res = await loadSurveyTemplateAction(selectedSlug);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      if (!("ok" in res) || !res.ok) return;

      onApply?.({
        questions: res.questions,
        sourceTitle: res.sourceTitle,
        sourceSlug: res.sourceSlug,
      });
      onClose();
      setSelectedSlug(null);
      setQuery("");
    });
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-template-picker-title"
    >
      <div className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2
              id="survey-template-picker-title"
              className="flex items-center gap-2 text-base font-semibold text-zinc-900"
            >
              <FileStack className="h-4 w-4 text-indigo-600" aria-hidden />
              템플릿 불러오기
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              기존 설문을 선택하면 문항 구성을 그대로 가져옵니다. 제목·기간 등은 새로
              입력합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="닫기"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="border-b border-zinc-100 px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="설문 제목 또는 ID 검색"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-zinc-500">
              {surveys.length === 0
                ? "불러올 설문이 없습니다. 먼저 설문을 하나 만드세요."
                : "검색 결과가 없습니다."}
            </li>
          ) : (
            filtered.map((s) => {
              const selected = selectedSlug === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlug(s.id);
                      setError(null);
                    }}
                    className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-indigo-300 bg-indigo-50/80 ring-1 ring-indigo-200"
                        : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <p className="font-medium text-zinc-900">{s.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {s.status} · {s.id}
                    </p>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {error ? (
          <p className="px-5 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending || !selectedSlug}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                불러오는 중…
              </>
            ) : mode === "navigate" ? (
              "새 설문에 적용"
            ) : (
              "문항 가져오기"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
