"use client";

import type { ReactNode } from "react";
import { formatKsicHierarchyLabel } from "@/lib/ksic-display";
import type { KsicDetailPreview, KsicEntry } from "@/lib/ksic-types";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Lightbulb,
  ListChecks,
  Loader2,
  MinusCircle,
  Route,
} from "lucide-react";

type Props = {
  preview: KsicDetailPreview | null;
  loading: boolean;
  focusedEntry: KsicEntry | null;
  onSelect: (entry: KsicEntry) => void;
};

function InfoCard({
  icon: Icon,
  title,
  children,
  tone = "default",
}: {
  icon: typeof FileText;
  title: string;
  children: ReactNode;
  tone?: "default" | "accent" | "muted" | "danger";
}) {
  const tones = {
    default: "border-sky-100/90 bg-white/90 shadow-sm shadow-sky-100/50",
    accent: "border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm shadow-sky-100/60",
    muted: "border-slate-200/80 bg-slate-50/50",
    danger: "border-red-200/90 bg-gradient-to-br from-red-50/80 to-white shadow-sm shadow-red-100/40",
  };

  const headerTones = {
    default: { title: "text-sky-900", icon: "bg-sky-500/10 text-sky-600" },
    accent: { title: "text-sky-900", icon: "bg-sky-500/10 text-sky-600" },
    muted: { title: "text-sky-900", icon: "bg-sky-500/10 text-sky-600" },
    danger: { title: "text-red-900", icon: "bg-red-500/10 text-red-600" },
  };

  const header = headerTones[tone];

  return (
    <section className={`rounded-xl border p-4 ${tones[tone]}`}>
      <h4 className={`flex items-center gap-2 text-xs font-semibold tracking-wide ${header.title}`}>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-lg ${header.icon}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {title}
      </h4>
      <div className={`mt-3 text-sm leading-relaxed ${tone === "danger" ? "text-red-800" : "text-slate-700"}`}>
        {children}
      </div>
    </section>
  );
}

function MetaPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-sky-100/90 bg-white/80 px-3 py-2.5 shadow-sm shadow-sky-50">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-600/80">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function KsicDetailPanel({ preview, loading, focusedEntry, onSelect }: Props) {
  if (!focusedEntry && !loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-sky-50/50 to-white px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
          <Layers className="h-7 w-7" aria-hidden />
        </div>
        <p className="mt-4 text-sm font-medium text-sky-950">분류를 선택해 주세요</p>
        <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-sky-900/60">
          왼쪽 목록에서 항목을 클릭하면 이곳에 코드·설명·포함 예시가 정리되어 표시됩니다.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-sky-50/60 to-white text-sm text-sky-800/70">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" aria-hidden />
        분류 내용을 불러오는 중…
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
    <div className="flex h-full flex-col bg-gradient-to-b from-sky-50/40 via-white to-white">
      <div className="shrink-0 border-b border-sky-100/90 bg-gradient-to-r from-sky-100/70 via-sky-50/50 to-white px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/25">
            <BookOpen className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-600">
              분류 내용 보기
            </p>
            <h3 className="mt-1 break-words text-base font-semibold leading-snug text-sky-950">
              {entry.name}
            </h3>
            <p className="mt-1 font-mono text-xs text-sky-800/75">{entry.code}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          <MetaPill label="차수" value={`${preview?.revision ?? 11}차`} />
          <MetaPill label="계층" value={entry.levelName} />
          {nameEn ? (
            <div className="col-span-2">
              <MetaPill label="영문명" value={nameEn} />
            </div>
          ) : null}
        </div>

        {entry.pathKo ? (
          <InfoCard icon={Route} title="분류 경로" tone="accent">
            <p className="text-xs leading-relaxed text-slate-600">{entry.pathKo}</p>
          </InfoCard>
        ) : null}

        {definition ? (
          <InfoCard icon={FileText} title="설명">
            <p className="whitespace-pre-wrap">{definition}</p>
          </InfoCard>
        ) : null}

        {examples.length > 0 ? (
          <InfoCard icon={ListChecks} title="포함 예시">
            <ul className="space-y-2">
              {examples.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 rounded-lg border border-sky-50 bg-sky-50/40 px-3 py-2 text-sm text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        ) : null}

        {exclusions.length > 0 ? (
          <InfoCard icon={MinusCircle} title="제외" tone="danger">
            <ul className="space-y-2">
              {exclusions.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-sm text-red-800"
                >
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        ) : null}

        {aiContext ? (
          <InfoCard icon={Lightbulb} title="설문 생성 참고 (AI)" tone="accent">
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-sky-950/85">
              {aiContext}
            </p>
          </InfoCard>
        ) : null}

        {!definition && examples.length === 0 && exclusions.length === 0 && !aiContext ? (
          <p className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-3 text-xs leading-relaxed text-sky-900/65">
            이 수준의 분류에는 상세 설명이 없을 수 있습니다.{" "}
            <strong className="font-medium text-sky-800">+</strong>를 눌러 하위 분류를 펼쳐
            세세분류를 확인해 보세요.
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-sky-100 bg-gradient-to-t from-sky-50/80 to-white p-4">
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-700 hover:to-sky-600"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          이 분류 선택
          <span className="sr-only">({formatKsicHierarchyLabel(entry)})</span>
        </button>
      </div>
    </div>
  );
}
