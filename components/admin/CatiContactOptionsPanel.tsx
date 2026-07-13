"use client";

import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ListChecks,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { saveGlobalCatiContactOptionsAction } from "@/app/actions/cati-contact-options";
import {
  DEFAULT_CATI_CONTACT_OPTIONS,
  MAX_CATI_CONTACT_OPTIONS,
  type CatiContactOption,
} from "@/lib/cati-contact-types";

type Props = {
  title: string;
  description?: string;
  initialOptions: CatiContactOption[];
  usingDefaults: boolean;
};

type EditableOption = {
  key: string;
  label: string;
  isSuccess: boolean;
  isActive: boolean;
};

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `opt-${Date.now()}-${keySeq}`;
}

function toEditable(options: CatiContactOption[]): EditableOption[] {
  return options.map((o) => ({
    key: nextKey(),
    label: o.label,
    isSuccess: o.isSuccess,
    isActive: o.isActive,
  }));
}

function defaultsAsEditable(): EditableOption[] {
  return DEFAULT_CATI_CONTACT_OPTIONS.map((o) => ({
    key: nextKey(),
    label: o.label,
    isSuccess: o.isSuccess,
    isActive: true,
  }));
}

export function CatiContactOptionsPanel({
  title,
  description,
  initialOptions,
  usingDefaults,
}: Props) {
  const [options, setOptions] = useState<EditableOption[]>(() => toEditable(initialOptions));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savedDefaults, setSavedDefaults] = useState(usingDefaults);
  const [pending, startTransition] = useTransition();

  const update = (key: string, patch: Partial<EditableOption>) => {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  };

  const move = (index: number, dir: -1 | 1) => {
    setOptions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (key: string) => {
    setOptions((prev) => prev.filter((o) => o.key !== key));
  };

  const addOption = () => {
    setError(null);
    setSuccess(null);
    setOptions((prev) => {
      if (prev.length >= MAX_CATI_CONTACT_OPTIONS) return prev;
      return [...prev, { key: nextKey(), label: "", isSuccess: false, isActive: true }];
    });
  };

  const resetToDefaults = () => {
    setError(null);
    setSuccess(null);
    setOptions(defaultsAsEditable());
  };

  const save = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const payload = options.map((o) => ({
        label: o.label,
        isSuccess: o.isSuccess,
        isActive: o.isActive,
      }));
      const result = await saveGlobalCatiContactOptionsAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOptions(toEditable(result.options));
      setSavedDefaults(false);
      setSuccess("컨택 결과 선택지를 저장했습니다.");
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="admin-card p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-700">
            <ListChecks className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="site-eyebrow">CATI Contact · 전체 공통</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-900">{title}</h2>
            <p className="mt-1 text-sm text-brand-700/85">
              {description ?? (
                <>
                  조사원이 UID 확인 후 선택하는 컨택 결과 항목입니다.{" "}
                  <strong>「성공(설문 진행)」</strong>으로 지정한 항목을 선택하면 설문 문항으로
                  넘어갑니다.
                </>
              )}
            </p>
          </div>
        </div>

        {savedDefaults ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            아직 저장된 선택지가 없어 <strong>앱 내장 기본 선택지</strong>를 표시하고 있습니다.
            수정 후 저장하면 모든 설문에 적용됩니다.
          </p>
        ) : null}
      </section>

      <section className="admin-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-brand-900">선택지 목록</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={pending}
              className="admin-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              기본값으로 초기화
            </button>
            <button
              type="button"
              onClick={addOption}
              disabled={pending || options.length >= MAX_CATI_CONTACT_OPTIONS}
              className="admin-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              선택지 추가
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="hidden grid-cols-[2rem_1fr_auto_auto_auto] items-center gap-3 px-1 text-xs font-semibold text-brand-700 sm:grid">
            <span>#</span>
            <span>선택지 이름</span>
            <span className="px-2">성공(설문 진행)</span>
            <span className="px-2">활성</span>
            <span className="px-2">순서·삭제</span>
          </div>

          {options.length === 0 ? (
            <p className="rounded-xl border border-brand-900/10 bg-surface/60 px-4 py-6 text-center text-sm text-brand-700">
              선택지가 없습니다. 「선택지 추가」로 항목을 만들어 주세요.
            </p>
          ) : null}

          {options.map((o, index) => (
            <div
              key={o.key}
              className="grid grid-cols-1 items-center gap-3 rounded-xl border border-brand-900/10 bg-white px-3 py-3 sm:grid-cols-[2rem_1fr_auto_auto_auto]"
            >
              <span className="text-sm font-semibold tabular-nums text-brand-700">
                {index + 1}
              </span>
              <input
                type="text"
                value={o.label}
                disabled={pending}
                onChange={(e) => update(o.key, { label: e.target.value })}
                placeholder="예: 성공, 부재, 거절…"
                className="w-full rounded-lg border border-brand-900/12 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/25 focus:ring-2 disabled:opacity-60"
              />
              <label className="inline-flex items-center gap-1.5 px-2 text-xs font-medium text-brand-800">
                <input
                  type="checkbox"
                  checked={o.isSuccess}
                  disabled={pending}
                  onChange={(e) => update(o.key, { isSuccess: e.target.checked })}
                  className="h-4 w-4 rounded border-brand-900/30 text-indigo-600"
                />
                <span className="sm:hidden">성공(설문 진행)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 px-2 text-xs font-medium text-brand-800">
                <input
                  type="checkbox"
                  checked={o.isActive}
                  disabled={pending}
                  onChange={(e) => update(o.key, { isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-brand-900/30 text-emerald-600"
                />
                <span className="sm:hidden">활성</span>
              </label>
              <div className="flex items-center gap-1 px-2">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={pending || index === 0}
                  aria-label="위로"
                  className="rounded-lg border border-brand-900/12 p-1.5 text-brand-700 hover:bg-surface disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={pending || index === options.length - 1}
                  aria-label="아래로"
                  className="rounded-lg border border-brand-900/12 p-1.5 text-brand-700 hover:bg-surface disabled:opacity-40"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => remove(o.key)}
                  disabled={pending}
                  aria-label="삭제"
                  className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {success ? (
          <p
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {success}
          </p>
        ) : null}

        <div className="mt-5">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2.5"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            저장
          </button>
        </div>
      </section>
    </div>
  );
}
