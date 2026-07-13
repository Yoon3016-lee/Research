"use client";

import { useActionState, useEffect, useState } from "react";
import { LayoutList, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createNavGroupAction,
  deleteNavGroupAction,
  updateNavGroupAction,
  type SiteHomepageActionState,
} from "@/app/actions/site-homepage";
import type { SiteNavGroup, SiteNavGuideMediaType } from "@/lib/site-homepage";

const initial: SiteHomepageActionState = {};

type Props = {
  groups: SiteNavGroup[];
  /** 홈페이지 통합 페이지에 포함될 때 true */
  embedded?: boolean;
};

export function NavGroupsManager({ groups, embedded = false }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {embedded ? (
        <div>
          <h2 className="text-base font-semibold text-brand-900">상단 메뉴</h2>
          <p className="mt-1 text-sm text-brand-700/80">
            공개 사이트 헤더의 상단 탭을 추가·수정·삭제합니다.
          </p>
        </div>
      ) : null}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
              <LayoutList className="h-4 w-4 text-indigo-600" aria-hidden />
              {embedded ? "상단 탭 목록" : "상단 탭 목록"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              공개 사이트 헤더에 표시되는 상단 메뉴 탭입니다. 각 탭의 하위 메뉴는{" "}
              <a href="#section-homepage" className="font-medium text-indigo-700 hover:underline">
                사이트 설정
              </a>
              에서 편집할 수 있습니다. 「이름·배너 수정」에서 탭별 안내 배너(PDF·이미지)를
              등록하면 해당 탭의 하위 페이지 상단에 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingKey(null);
              setShowCreate(!showCreate);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            탭 추가
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
            등록된 상단 탭이 없습니다. 「탭 추가」로 첫 탭을 만들어 주세요.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-100">
            {groups.map((group) => (
              <li key={group.key} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">{group.label}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      탭 ID:{" "}
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{group.key}</code>
                      <span className="ml-2 text-xs text-zinc-400">
                        하위 메뉴 {group.items.length}개
                      </span>
                      {group.guidePdfUrl ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          안내 배너
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreate(false);
                        setEditingKey(editingKey === group.key ? null : group.key);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      이름·배너 수정
                    </button>
                    <DeleteNavGroupButton
                      groupKey={group.key}
                      label={group.label}
                      itemCount={group.items.length}
                    />
                  </div>
                </div>

                {editingKey === group.key ? (
                  <NavGroupEditForm
                    groupKey={group.key}
                    initialLabel={group.label}
                    initialGuidePdfUrl={group.guidePdfUrl}
                    initialGuideMediaType={group.guideMediaType}
                    onDone={() => setEditingKey(null)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {showCreate ? (
          <NavGroupCreateForm onDone={() => setShowCreate(false)} />
        ) : null}
      </section>
    </div>
  );
}

function NavGroupCreateForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createNavGroupAction, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="mt-6 space-y-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4"
    >
      <p className="text-sm font-medium text-zinc-800">새 상단 탭</p>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">탭 이름</span>
        <input
          name="label"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          placeholder="예: 뉴스"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          공개 사이트 헤더에 표시되는 이름입니다.
        </span>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">탭 ID (선택)</span>
        <input
          name="key"
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          placeholder="news"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          영문 소문자·숫자·하이픈. 비워 두면 탭 이름에서 자동 생성합니다. (한글만 있는
          이름은 ID를 직접 입력하세요)
        </span>
      </label>
      <GuideFileField />
      <ActionMessage state={state} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "추가 중…" : "탭 추가"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function NavGroupEditForm({
  groupKey,
  initialLabel,
  initialGuidePdfUrl,
  initialGuideMediaType,
  onDone,
}: {
  groupKey: string;
  initialLabel: string;
  initialGuidePdfUrl: string | null;
  initialGuideMediaType: SiteNavGuideMediaType | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateNavGroupAction, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
    >
      <input type="hidden" name="key" value={groupKey} />
      <p className="text-xs text-zinc-500">
        탭 ID <code className="rounded bg-white/80 px-1">{groupKey}</code> 는 변경할 수
        없습니다.
      </p>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">탭 이름</span>
        <input
          name="label"
          required
          defaultValue={initialLabel}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>
      <GuideFileField
        currentUrl={initialGuidePdfUrl}
        currentMediaType={initialGuideMediaType}
      />
      <ActionMessage state={state} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white"
        >
          닫기
        </button>
      </div>
    </form>
  );
}

function GuideFileField({
  currentUrl = null,
  currentMediaType = null,
}: {
  currentUrl?: string | null;
  currentMediaType?: SiteNavGuideMediaType | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
      <p className="font-medium text-zinc-700">안내 배너 (선택)</p>
      <p className="mt-1 text-xs text-zinc-500">
        이 탭에 속한 하위 메뉴 페이지 상단에 표시됩니다. PDF 또는 이미지(JPG·PNG) 파일을
        올릴 수 있습니다.
      </p>
      {currentUrl ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-lg border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          >
            현재 배너 보기{currentMediaType === "image" ? " (이미지)" : " (PDF)"}
          </a>
          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
            <input type="checkbox" name="remove_guide_pdf" className="h-3.5 w-3.5" />
            배너 삭제
          </label>
        </div>
      ) : null}
      <input
        type="file"
        name="guide_pdf"
        accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
        className="mt-2 block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
      />
      {currentUrl ? (
        <p className="mt-1 text-xs text-zinc-400">
          새 파일을 선택하면 기존 배너를 교체합니다.
        </p>
      ) : null}
    </div>
  );
}

function DeleteNavGroupButton({
  groupKey,
  label,
  itemCount,
}: {
  groupKey: string;
  label: string;
  itemCount: number;
}) {
  const [state, formAction, pending] = useActionState(deleteNavGroupAction, initial);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const detail =
          itemCount > 0
            ? `\n\n이 탭의 하위 메뉴 ${itemCount}개도 함께 삭제됩니다.`
            : "";
        if (!confirm(`「${label}」 탭을 삭제할까요?${detail}`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="key" value={groupKey} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        삭제
      </button>
      {state.error ? <p className="mt-1 text-xs text-red-600">{state.error}</p> : null}
    </form>
  );
}

function ActionMessage({ state }: { state: SiteHomepageActionState }) {
  if (state.error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="text-sm text-emerald-700" role="status">
        저장했습니다. 공개 사이트에 반영됩니다.
      </p>
    );
  }
  return null;
}
