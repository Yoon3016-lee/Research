"use client";

import type { KsicExternalValidation } from "@/lib/ksic-external/types";
import type { KsicEntry } from "@/lib/ksic-types";
import type { SurveyAiBrief } from "@/lib/survey-ai/types";
import { FolderTree, Loader2, Search } from "lucide-react";

type Props = {
  brief: SurveyAiBrief;
  ksicQuery: string;
  ksicResults: KsicEntry[];
  ksicSearching: boolean;
  onBriefChange: (patch: Partial<SurveyAiBrief>) => void;
  onKsicQueryChange: (value: string) => void;
  onOpenPicker: () => void;
  onSearch: () => void;
  onSelectSearchResult: (entry: KsicEntry) => void;
  onCodeBlur: () => void;
  externalValidation?: KsicExternalValidation | null;
  externalValidationLoading?: boolean;
  /** 보완 질문 단계 — 코드·명칭 입력란 숨김 */
  compact?: boolean;
};

export function KsicSelectSection({
  brief,
  ksicQuery,
  ksicResults,
  ksicSearching,
  onBriefChange,
  onKsicQueryChange,
  onOpenPicker,
  onSearch,
  onSelectSearchResult,
  onCodeBlur,
  externalValidation = null,
  externalValidationLoading = false,
  compact = false,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">KSIC (한국표준산업분류)</h2>
      <p className="mt-1 text-sm text-zinc-500">
        코드·산업명·<strong className="font-medium text-zinc-700">포함 예시 품목</strong>으로 검색하거나
        분류표에서 단계별로 선택하세요.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          value={ksicQuery}
          onChange={(e) => onKsicQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch();
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="예: 56121, 커피, 벼 재배"
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onSearch}
            disabled={ksicSearching}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
          >
            {ksicSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            검색
          </button>
          <button
            type="button"
            onClick={onOpenPicker}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-900 hover:bg-indigo-100"
          >
            <FolderTree className="h-4 w-4 shrink-0" aria-hidden />
            분류표에서 선택
          </button>
        </div>
      </div>

      {ksicResults.length > 0 ? (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50">
          {ksicResults.map((entry) => (
            <li key={entry.code}>
              <button
                type="button"
                onClick={() => onSelectSearchResult(entry)}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-white"
              >
                <span>
                  <strong className="font-mono text-indigo-800">{entry.code}</strong> {entry.name}
                  <span className="ml-1.5 text-[10px] font-medium text-zinc-500">
                    {entry.levelName}
                  </span>
                </span>
                {entry.pathKo && entry.pathKo !== entry.name ? (
                  <span className="line-clamp-2 text-xs text-zinc-500">{entry.pathKo}</span>
                ) : null}
                {entry.matchedExample ? (
                  <span className="line-clamp-2 text-xs text-sky-700">
                    포함 예시 매칭: {entry.matchedExample}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!compact ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">KSIC 코드 *</span>
            <input
              required
              value={brief.ksicCode}
              onChange={(e) => onBriefChange({ ksicCode: e.target.value })}
              onBlur={onCodeBlur}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="예: 56121"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">산업 명칭</span>
            <input
              value={brief.ksicName}
              onChange={(e) => onBriefChange({ ksicName: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="검색·분류표 선택 시 자동 입력"
            />
          </label>
        </div>
      ) : brief.ksicCode.trim() ? (
        <p className="mt-3 text-sm text-zinc-600">
          현재 선택:{" "}
          <span className="font-mono font-medium text-indigo-800">{brief.ksicCode}</span>
          {brief.ksicName.trim() ? ` ${brief.ksicName}` : null}
        </p>
      ) : null}

      {brief.ksicCode.trim() && (externalValidationLoading || externalValidation) ? (
        <div
          className={`mt-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
            externalValidationLoading
              ? "border-zinc-200 bg-zinc-50 text-zinc-500"
              : externalValidation?.status === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : externalValidation?.status === "no_snapshot"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {externalValidationLoading ? (
            "외부 업종 목록과 대조 중…"
          ) : (
            <>
              <p>{externalValidation?.message}</p>
              {externalValidation?.lastSyncedAt ? (
                <p className="mt-1 text-[10px] opacity-80">
                  스냅샷 기준:{" "}
                  {new Date(externalValidation.lastSyncedAt).toLocaleString("ko-KR")}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
