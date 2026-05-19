"use client";

import { useActionState, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createSiteBannerAction,
  deleteSiteBannerAction,
  moveSiteBannerOrderAction,
  toggleSiteBannerActiveAction,
  type SiteBannerActionState,
} from "@/app/actions/site-banners";
import type { SiteBanner } from "@/lib/site-banners";

const initial: SiteBannerActionState = {};

type Props = {
  banners: SiteBanner[];
};

export function BannersManager({ banners }: Props) {
  const [showCreate, setShowCreate] = useState(banners.length === 0);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">등록된 팝업 배너</h2>
            <p className="mt-1 text-sm text-zinc-500">
              홈 왼쪽 상단에 작은 창으로 순서대로 표시됩니다. JPG·PNG·PDF를 등록할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            배너 추가
          </button>
        </div>

        {banners.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
            등록된 배너가 없습니다.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {banners.map((banner, idx) => (
              <BannerRow key={banner.id} banner={banner} isFirst={idx === 0} isLast={idx === banners.length - 1} />
            ))}
          </ul>
        )}
      </section>

      {showCreate ? (
        <CreateBannerForm onCancel={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
      ) : null}
    </div>
  );
}

function BannerRow({
  banner,
  isFirst,
  isLast,
}: {
  banner: SiteBanner;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="flex flex-col gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:flex-row">
      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white sm:w-48">
        {banner.mediaType === "pdf" ? (
          <iframe title={banner.title} src={banner.fileUrl} className="h-full w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.fileUrl} alt={banner.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900">{banner.title || "(제목 없음)"}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {banner.mediaType === "pdf" ? "PDF" : "이미지"}
          {banner.linkUrl ? ` · 링크: ${banner.linkUrl}` : ""}
          {" · "}
          {banner.isActive ? "노출 중" : "숨김"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <OrderButton id={banner.id} direction="up" disabled={isFirst} />
          <OrderButton id={banner.id} direction="down" disabled={isLast} />
          <ToggleActiveButton id={banner.id} isActive={banner.isActive} />
          <DeleteBannerButton id={banner.id} title={banner.title} />
        </div>
      </div>
    </li>
  );
}

function OrderButton({
  id,
  direction,
  disabled,
}: {
  id: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(moveSiteBannerOrderAction, initial);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
      >
        {direction === "up" ? (
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        )}
        {direction === "up" ? "위로" : "아래로"}
      </button>
      {state.error ? <span className="sr-only">{state.error}</span> : null}
    </form>
  );
}

function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [state, formAction, pending] = useActionState(toggleSiteBannerActiveAction, initial);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="is_active" value={isActive ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        {isActive ? (
          <>
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
            숨기기
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" aria-hidden />
            노출
          </>
        )}
      </button>
      {state.error ? <span className="sr-only">{state.error}</span> : null}
    </form>
  );
}

function DeleteBannerButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, pending] = useActionState(deleteSiteBannerAction, initial);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`「${title || "배너"}」를 삭제할까요?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        삭제
      </button>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}

function CreateBannerForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(createSiteBannerAction, initial);

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <section className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
        <ImageIcon className="h-4 w-4 text-indigo-600" aria-hidden />
        새 팝업 배너 등록
      </h2>
      <form action={formAction} encType="multipart/form-data" className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">배너 제목 (선택)</span>
          <input
            name="title"
            className="mt-1 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            placeholder="예: 2026 봄 프로모션"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">클릭 시 이동 링크 (선택)</span>
          <input
            name="link_url"
            className="mt-1 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            placeholder="/surveys 또는 https://..."
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">배너 파일 *</span>
          <input
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp,application/pdf,.pdf"
            className="mt-1 block w-full max-w-md text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          <span className="mt-1 block text-xs text-zinc-500">
            JPG, PNG, GIF, WEBP, PDF · 최대 10MB · 가로형 이미지를 권장합니다.
          </span>
        </label>
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? "등록 중…" : "배너 등록"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
          >
            취소
          </button>
        </div>
      </form>
    </section>
  );
}
