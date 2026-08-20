"use client";

import { useState } from "react";
import {
  MAX_LIKERT_SCALE_SIZE,
  MIN_LIKERT_SCALE_SIZE,
  clampLikertScaleSize,
  likertCircledMark,
  normalizeLikertScaleLabels,
} from "@/lib/likert-scale";
import {
  LIKERT_LABEL_TEMPLATES,
  expandLikertLabelTemplate,
  findLikertLabelTemplate,
} from "@/lib/likert-label-templates";
import type { DraftQuestion } from "@/lib/survey-types";

type Props = {
  scaleSize: number;
  labels: string[];
  onChange: (patch: Partial<DraftQuestion>) => void;
};

export function LikertScaleSettings({ scaleSize, labels, onChange }: Props) {
  const [templateSelect, setTemplateSelect] = useState("");
  const size = clampLikertScaleSize(scaleSize);
  const normalized = normalizeLikertScaleLabels(labels, size);

  const setSize = (nextRaw: number) => {
    const next = clampLikertScaleSize(nextRaw);
    onChange({
      maxSelections: next,
      likertScaleLabels: normalizeLikertScaleLabels(labels, next),
    });
  };

  const setLabel = (index: number, text: string) => {
    const next = [...normalized];
    next[index] = text;
    onChange({ likertScaleLabels: next });
  };

  const applyTemplate = (templateId: string) => {
    const template = findLikertLabelTemplate(templateId);
    if (!template) return;
    onChange({
      likertScaleLabels: expandLikertLabelTemplate(template, size),
    });
    setTemplateSelect("");
  };

  return (
    <div className="mt-4 space-y-4 border-t border-emerald-100 pt-4">
      <label className="block">
        <span className="text-sm font-medium text-zinc-800">척도 크기</span>
        <p className="mt-0.5 text-xs text-zinc-500">
          {MIN_LIKERT_SCALE_SIZE}~{MAX_LIKERT_SCALE_SIZE}점. 기본 5점.
        </p>
        <input
          type="number"
          min={MIN_LIKERT_SCALE_SIZE}
          max={MAX_LIKERT_SCALE_SIZE}
          value={size}
          onChange={(e) => setSize(Number(e.target.value) || MIN_LIKERT_SCALE_SIZE)}
          className="mt-2 w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>

      <div>
        <p className="text-sm font-medium text-zinc-800">점수별 라벨 (선택)</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          응답 화면에 ①·②·…와 함께 표시됩니다.{" "}
          <span className="font-medium text-zinc-700">
            1번(왼쪽)은 긍정, 끝번(오른쪽)은 부정
          </span>
          으로 작성하세요.
        </p>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-zinc-700">라벨 템플릿</span>
          <p className="mt-0.5 text-xs text-zinc-500">
            선택하면 현재 척도 크기({size}점)에 맞게 「매우 ~ · 보통 · ~ 전혀」
            형식으로 자동 채웁니다.
          </p>
          <select
            value={templateSelect}
            onChange={(e) => {
              const id = e.target.value;
              setTemplateSelect(id);
              if (id) applyTemplate(id);
            }}
            className="mt-2 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">템플릿 선택…</option>
            {LIKERT_LABEL_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 space-y-2">
          {normalized.map((label, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <span className="w-10 shrink-0 font-medium text-zinc-600">
                {likertCircledMark(i + 1)}
              </span>
              <input
                value={label}
                onChange={(e) => setLabel(i, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                placeholder={
                  i === 0
                    ? "예: 매우 그렇다"
                    : i === size - 1
                      ? "예: 전혀 그렇지 않다"
                      : `${likertCircledMark(i + 1)} 라벨`
                }
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
