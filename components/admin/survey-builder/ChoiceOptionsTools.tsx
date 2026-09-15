"use client";

import { useState } from "react";
import { ClipboardPaste, Sparkles } from "lucide-react";
import { parseBulkOptionText } from "@/lib/survey-option-bulk";
import type { SurveyOptionTemplateSummary } from "@/lib/survey-option-template-types";

type Props = {
  templates: SurveyOptionTemplateSummary[];
  onApplyOptions: (options: string[]) => void;
};

export function ChoiceOptionsTools({ templates, onApplyOptions }: Props) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [templateSelect, setTemplateSelect] = useState("");

  const applyBulk = () => {
    const options = parseBulkOptionText(bulkText);
    if (options.length === 0) {
      setBulkError("한 줄에 하나씩 보기를 입력해 주세요.");
      return;
    }
    setBulkError(null);
    onApplyOptions(options);
    setBulkText("");
    setBulkOpen(false);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template || template.options.length === 0) return;
    onApplyOptions(template.options);
    setTemplateSelect("");
  };

  const hasTemplates = templates.length > 0;

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setBulkOpen((v) => !v);
            setBulkError(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <ClipboardPaste className="h-3.5 w-3.5" aria-hidden />
          보기 일괄입력
        </button>

        <label className="inline-flex min-w-0 flex-1 items-center gap-1.5 sm:max-w-xs">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
          <select
            value={templateSelect}
            disabled={!hasTemplates}
            onChange={(e) => {
              const id = e.target.value;
              setTemplateSelect(id);
              if (id) applyTemplate(id);
            }}
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
            aria-label="보기 자동완성 템플릿"
          >
            {hasTemplates ? (
              <>
                <option value="">보기 자동완성…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.options.length}개)
                  </option>
                ))}
              </>
            ) : (
              <option value="">-저장된 템플릿 없음-</option>
            )}
          </select>
        </label>
      </div>

      {bulkOpen ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">
            한 줄에 보기 하나씩 입력하세요. 줄바꿈(\n) 기준으로 보기가 나뉩니다. 적용 시 기존
            보기를 대체합니다.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              setBulkError(null);
            }}
            rows={5}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            placeholder={"예:\n매우 그렇다\n그렇다\n보통이다\n그렇지 않다\n전혀 그렇지 않다"}
          />
          {bulkError ? (
            <p className="text-xs text-red-600" role="alert">
              {bulkError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyBulk}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              일괄 적용
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkOpen(false);
                setBulkError(null);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
