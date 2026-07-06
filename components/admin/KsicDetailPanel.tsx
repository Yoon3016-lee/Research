"use client";

import type { ReactNode } from "react";
import { formatKsicHierarchyLabel } from "@/lib/ksic-display";
import type { KsicDetailPreview, KsicEntry } from "@/lib/ksic-types";
import { Loader2 } from "lucide-react";

type Props = {
  preview: KsicDetailPreview | null;
  loading: boolean;
  focusedEntry: KsicEntry | null;
  onSelect: (entry: KsicEntry) => void;
};

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <th
        scope="row"
        className="w-24 shrink-0 bg-zinc-50/80 px-3 py-2 text-left align-top text-xs font-medium text-zinc-500"
      >
        {label}
      </th>
      <td className="break-words px-3 py-2 text-sm leading-relaxed text-zinc-800">{children}</td>
    </tr>
  );
}

export function KsicDetailPanel({ preview, loading, focusedEntry, onSelect }: Props) {
  if (!focusedEntry && !loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center text-sm text-zinc-500">
        <p>왼쪽 목록에서 분류를 클릭하면</p>
        <p className="mt-1">이곳에 분류 내용이 표시됩니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        분류 내용 불러오는 중…
      </div>
    );
  }

  const entry = preview?.entry ?? focusedEntry!;
  const nameEn = preview?.nameEn ?? "";
  const definition = preview?.definition ?? "";
  const examples = preview?.examples ?? [];
  const exclusions = preview?.exclusions ?? [];
  const aiContext = preview?.aiContextForSurvey;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">분류 내용 보기</h3>
        <p className="mt-0.5 break-words text-xs leading-relaxed text-zinc-500">
          {formatKsicHierarchyLabel(entry)}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-zinc-200 text-sm">
          <tbody>
            <MetaRow label="차수">{preview?.revision ?? 11}차</MetaRow>
            <MetaRow label="코드">
              <span className="font-mono">{entry.code}</span>
            </MetaRow>
            <MetaRow label="분류명">{entry.name}</MetaRow>
            {nameEn ? <MetaRow label="영문명">{nameEn}</MetaRow> : null}
            <MetaRow label="계층">{entry.levelName}</MetaRow>
            {entry.pathKo ? (
              <MetaRow label="경로">
                <span className="text-xs leading-relaxed text-zinc-600">{entry.pathKo}</span>
              </MetaRow>
            ) : null}
          </tbody>
        </table>

        {definition ? (
          <section className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">설명</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-800">{definition}</p>
          </section>
        ) : null}

        {examples.length > 0 ? (
          <section className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">포함 예시</h4>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-zinc-800">
              {examples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {exclusions.length > 0 ? (
          <section className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">제외</h4>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-zinc-700">
              {exclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {aiContext ? (
          <section className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
            <h4 className="text-xs font-semibold text-indigo-800">설문 생성 참고 (AI)</h4>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-indigo-900/90">
              {aiContext}
            </p>
          </section>
        ) : null}

        {!definition && examples.length === 0 && exclusions.length === 0 && !aiContext ? (
          <p className="mt-4 text-xs text-zinc-500">
            이 수준의 분류에는 상세 설명이 없을 수 있습니다. 하위 분류를 펼쳐 세세분류를
            확인하세요.
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-zinc-200 bg-white p-3">
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          이 분류 선택
        </button>
      </div>
    </div>
  );
}
