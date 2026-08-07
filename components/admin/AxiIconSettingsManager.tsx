"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Sparkles } from "lucide-react";
import {
  deleteSiteAxiIconAction,
  updateSiteAxiAllowedRolesAction,
  updateSiteAxiIconAction,
  type SiteHomepageActionState,
} from "@/app/actions/site-homepage";
import {
  AXI_ACCESS_KEYS,
  AXI_ACCESS_LABELS,
  type AxiAccessKey,
} from "@/lib/axi/access";

const initial: SiteHomepageActionState = {};

type Props = {
  axiIconUrl: string | null;
  axiAllowedRoles: string[];
};

export function AxiIconSettingsManager({ axiIconUrl, axiAllowedRoles }: Props) {
  const router = useRouter();
  const [uploadState, uploadAction, uploadPending] = useActionState(
    updateSiteAxiIconAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSiteAxiIconAction,
    initial,
  );
  const [rolesState, rolesAction, rolesPending] = useActionState(
    updateSiteAxiAllowedRolesAction,
    initial,
  );

  useEffect(() => {
    if (uploadState.ok || deleteState.ok || rolesState.ok) router.refresh();
  }, [uploadState.ok, deleteState.ok, rolesState.ok, router]);

  const checked = new Set(axiAllowedRoles);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
          <Sparkles className="h-4 w-4 text-teal-600" aria-hidden />
          AXI 사용 권한
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          공개 사이트에서 AXI 플로팅 아이콘을 보고 질문할 수 있는 대상을 선택합니다. 선택한
          역할만 AXI를 이용합니다.
        </p>

        <form action={rolesAction} className="mt-4 space-y-4">
          <fieldset>
            <legend className="sr-only">AXI 사용 가능 역할</legend>
            <ul className="grid gap-2 sm:grid-cols-2">
              {AXI_ACCESS_KEYS.map((key) => (
                <li key={key}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      name="axi_roles"
                      value={key}
                      defaultChecked={checked.has(key)}
                      className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>
                      <span className="font-medium">{AXI_ACCESS_LABELS[key as AxiAccessKey]}</span>
                      <span className="ml-1.5 text-xs text-zinc-500">({key})</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          {rolesState.error ? (
            <p className="text-sm text-red-600" role="alert">
              {rolesState.error}
            </p>
          ) : null}
          {rolesState.ok ? (
            <p className="text-sm text-emerald-700" role="status">
              AXI 사용 권한을 저장했습니다.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={rolesPending}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {rolesPending ? "저장 중…" : "권한 저장"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
          <Sparkles className="h-4 w-4 text-teal-600" aria-hidden />
          AXI 아이콘
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          공개 사이트 우측 여백에 표시되는 드래그 가능 AXI 아이콘 이미지입니다. 위 권한에
          포함된 사용자에게만 보입니다.
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
            저장했습니다. 공개 사이트에 반영됩니다.
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
    </div>
  );
}
