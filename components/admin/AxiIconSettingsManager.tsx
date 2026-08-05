"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Sparkles } from "lucide-react";
import {
  deleteSiteAxiIconAction,
  updateSiteAxiIconAction,
  type SiteHomepageActionState,
} from "@/app/actions/site-homepage";

const initial: SiteHomepageActionState = {};

type Props = {
  axiIconUrl: string | null;
};

export function AxiIconSettingsManager({ axiIconUrl }: Props) {
  const router = useRouter();
  const [uploadState, uploadAction, uploadPending] = useActionState(
    updateSiteAxiIconAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSiteAxiIconAction,
    initial,
  );

  useEffect(() => {
    if (uploadState.ok || deleteState.ok) router.refresh();
  }, [uploadState.ok, deleteState.ok, router]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
        <Sparkles className="h-4 w-4 text-teal-600" aria-hidden />
        AXI 아이콘
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        설문 참여 화면 우측 여백에 표시되는 드래그 가능 AXI 아이콘 이미지입니다. 직원(직원
        이상)에게만 보입니다.
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        JPG, PNG, GIF, WEBP · 최대 10MB · 정사각형·원형 아이콘 권장
      </p>

      {axiIconUrl ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={axiIconUrl}
              alt="AXI 아이콘"
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(axiIconUrl);
                  if (!res.ok) throw new Error("download failed");
                  const blob = await res.blob();
                  const ext =
                    blob.type === "image/png"
                      ? "png"
                      : blob.type === "image/jpeg"
                        ? "jpg"
                        : blob.type === "image/gif"
                          ? "gif"
                          : blob.type === "image/webp"
                            ? "webp"
                            : "png";
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `axi-icon.${ext}`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  window.open(axiIconUrl, "_blank", "noopener,noreferrer");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              아이콘 다운로드
            </button>
            <form action={deleteAction}>
              <button
                type="submit"
                disabled={deletePending}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deletePending ? "삭제 중…" : "아이콘 삭제"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          등록된 아이콘이 없습니다. 미등록 시 기본 AXI 아이콘이 표시됩니다.
        </p>
      )}

      {(uploadState.error || deleteState.error) && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {uploadState.error || deleteState.error}
        </p>
      )}
      {(uploadState.ok || deleteState.ok) && (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          저장했습니다. 공개 설문 화면에 반영됩니다.
        </p>
      )}

      <form action={uploadAction} className="mt-4 max-w-lg space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">
            {axiIconUrl ? "아이콘 변경" : "아이콘 업로드"}
          </span>
          <input
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200"
          />
        </label>
        <button
          type="submit"
          disabled={uploadPending}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {uploadPending ? "업로드 중…" : axiIconUrl ? "아이콘 변경" : "아이콘 업로드"}
        </button>
      </form>
    </section>
  );
}
