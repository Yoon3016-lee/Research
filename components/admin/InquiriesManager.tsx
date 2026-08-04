"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { updateSiteInquiryAction, type SiteInquiryActionState } from "@/app/actions/site-inquiries";
import {
  SITE_INQUIRY_STATUS_LABELS,
  SITE_INQUIRY_STATUSES,
  SITE_INQUIRY_TYPE_LABELS,
  type SiteInquiry,
  type SiteInquiryStatus,
  type SiteInquiryType,
} from "@/lib/site-inquiry-types";

const initial: SiteInquiryActionState = {};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: SiteInquiryStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "in_progress":
      return "bg-sky-100 text-sky-900";
    case "completed":
      return "bg-emerald-100 text-emerald-900";
    case "cancelled":
      return "bg-zinc-200 text-zinc-700";
  }
}

function typeBadgeClass(type: SiteInquiryType): string {
  return type === "survey"
    ? "bg-violet-100 text-violet-900"
    : "bg-teal-100 text-teal-900";
}

function InquiryRow({ item }: { item: SiteInquiry }) {
  const [state, formAction, pending] = useActionState(updateSiteInquiryAction, initial);

  useEffect(() => {
    if (state.ok) {
      /* revalidate refreshes list */
    }
  }, [state.ok]);

  return (
    <details className="group rounded-2xl border border-zinc-200 bg-white shadow-sm open:ring-2 open:ring-indigo-500/15">
      <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadgeClass(item.inquiryType)}`}
              >
                {SITE_INQUIRY_TYPE_LABELS[item.inquiryType]}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}
              >
                {SITE_INQUIRY_STATUS_LABELS[item.status]}
              </span>
            </div>
            <p className="mt-2 font-medium text-zinc-900">{item.subject}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {item.name}
              {item.organization ? ` · ${item.organization}` : ""} · {item.email}
            </p>
          </div>
          <p className="shrink-0 text-xs text-zinc-500">{formatDate(item.submittedAt)}</p>
        </div>
      </summary>

      <div className="border-t border-zinc-100 px-5 py-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">연락처</dt>
            <dd className="font-medium text-zinc-900">{item.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">접수 일시</dt>
            <dd className="font-medium text-zinc-900">{formatDate(item.submittedAt)}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">문의 내용</p>
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
            {item.message}
          </p>
        </div>

        <form action={formAction} className="mt-5 space-y-3 border-t border-zinc-100 pt-5">
          <input type="hidden" name="id" value={item.id} />
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">처리 상태</span>
            <select
              name="status"
              defaultValue={item.status}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:max-w-xs"
            >
              {SITE_INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SITE_INQUIRY_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">관리자 메모</span>
            <textarea
              name="admin_note"
              rows={3}
              defaultValue={item.adminNote ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="처리 내역·회신 요약 등"
            />
          </label>
          {state.error ? (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p className="text-sm text-emerald-700">저장되었습니다.</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            저장
          </button>
        </form>
      </div>
    </details>
  );
}

type Props = {
  items: SiteInquiry[];
  dbError?: string;
  typeFilter: SiteInquiryType | "all";
  statusFilter: SiteInquiryStatus | "all";
};

export function InquiriesManager({
  items,
  dbError,
  typeFilter,
  statusFilter,
}: Props) {
  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-5 py-4 text-sm text-sky-950">
        <p className="font-semibold">문의 페이지 연결 URL (공개 메뉴 미노출)</p>
        <ul className="mt-2 space-y-1 font-mono text-xs sm:text-sm">
          <li>
            조사 문의: <code className="rounded bg-white/80 px-1">/inquiry?type=survey</code>
          </li>
          <li>
            서비스 문의: <code className="rounded bg-white/80 px-1">/inquiry?type=service</code>
          </li>
        </ul>
        <p className="mt-2 text-xs text-sky-900/80">
          홈페이지 이미지 링크·하위 메뉴에 위 주소를 연결하세요. 추후 홈페이지 관리에서 설정할
          예정입니다.
        </p>
      </div>

      {dbError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {dbError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
        <span>
          전체 <strong className="text-zinc-900">{items.length}</strong>건
        </span>
        {pendingCount > 0 ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            접수 대기 {pendingCount}건
          </span>
        ) : null}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">유형</span>
          <select
            name="type"
            defaultValue={typeFilter}
            className="mt-1 block rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="all">전체</option>
            <option value="survey">조사 문의</option>
            <option value="service">서비스 문의</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">상태</span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="mt-1 block rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="all">전체</option>
            {SITE_INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SITE_INQUIRY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          필터 적용
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
          {dbError ? "문의를 불러올 수 없습니다." : "접수된 문의가 없습니다."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <InquiryRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
