"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createNavItemAction,
  deleteNavItemAction,
  deleteSiteLogoAction,
  updateNavItemAction,
  updateNavItemPageAction,
  updateSiteLogoAction,
  updateSiteNameAction,
  type SiteHomepageActionState,
} from "@/app/actions/site-homepage";
import { PageBodyEditor } from "@/components/admin/PageBodyEditor";
import { SiteNameFontField } from "@/components/admin/SiteNameFontField";
import type { SiteHomepageConfig, SitePage } from "@/lib/site-homepage";
import { parseSiteNameFontKey } from "@/lib/site-name-fonts";

const initial: SiteHomepageActionState = {};

type Props = {
  config: SiteHomepageConfig;
  pages: Record<string, SitePage>;
  /** 홈페이지 통합 페이지에 포함될 때 true */
  embedded?: boolean;
};

export function HomepageSettingsManager({ config, pages, embedded = false }: Props) {
  const [addingGroup, setAddingGroup] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      {embedded ? (
        <div>
          <h2 className="text-base font-semibold text-brand-900">사이트 설정</h2>
          <p className="mt-1 text-sm text-brand-700/80">
            공개 사이트 이름·로고와 각 상단 탭의 하위 메뉴를 편집합니다.
          </p>
        </div>
      ) : null}
      <SiteBrandingSection
        initialName={config.siteName}
        initialFont={config.siteNameFont}
        initialLogoUrl={config.logoUrl}
      />

      <p className="rounded-xl border border-accent-500/25 bg-accent-500/10 px-4 py-3 text-sm text-brand-900">
        상단 탭(회사 소개 · 설문 조사 등) 추가·삭제는{" "}
        <a href="#section-nav" className="font-semibold underline underline-offset-2">
          상단 메뉴
        </a>
        섹션에서 할 수 있습니다. 아래에서는 각 탭의 하위 메뉴만 편집합니다.
      </p>

      {config.groups.map((group) => (
        <section
          key={group.key}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{group.label}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                상단 메뉴 「{group.label}」 드롭다운에 표시되는 하위 항목입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingItemId(null);
                setEditingPageId(null);
                setAddingGroup(addingGroup === group.key ? null : group.key);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" aria-hidden />
              하위 메뉴 추가
            </button>
          </div>

          {group.items.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
              등록된 하위 메뉴가 없습니다.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-zinc-100">
              {group.items.map((item) => {
                const page = item.pageId ? pages[item.pageId] : undefined;
                return (
                  <li key={item.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">{item.label}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          링크:{" "}
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{item.href}</code>
                          {page ? (
                            <span className="ml-2 text-xs text-indigo-600">(CMS 페이지)</span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingGroup(null);
                            setEditingPageId(null);
                            setEditingItemId(editingItemId === item.id ? null : item.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          메뉴 편집
                        </button>
                        {page ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingGroup(null);
                              setEditingItemId(null);
                              setEditingPageId(editingPageId === page.id ? null : page.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-50"
                          >
                            <Globe className="h-3.5 w-3.5" aria-hidden />
                            페이지 본문
                          </button>
                        ) : null}
                        <DeleteNavItemButton id={item.id} label={item.label} />
                      </div>
                    </div>

                    {editingItemId === item.id ? (
                      <NavItemEditForm
                        itemId={item.id}
                        initialLabel={item.label}
                        initialHref={item.href}
                        onDone={() => setEditingItemId(null)}
                      />
                    ) : null}

                    {page && editingPageId === page.id ? (
                      <PageEditForm page={page} onDone={() => setEditingPageId(null)} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {addingGroup === group.key ? (
            <NavItemCreateForm groupKey={group.key} onDone={() => setAddingGroup(null)} />
          ) : null}
        </section>
      ))}
    </div>
  );
}

function SiteBrandingSection({
  initialName,
  initialFont,
  initialLogoUrl,
}: {
  initialName: string;
  initialFont: SiteHomepageConfig["siteNameFont"];
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [nameState, nameFormAction, namePending] = useActionState(updateSiteNameAction, initial);
  const [previewName, setPreviewName] = useState(initialName);
  const [fontKey, setFontKey] = useState(initialFont);

  useEffect(() => {
    setPreviewName(initialName);
    setFontKey(initialFont);
  }, [initialName, initialFont]);

  useEffect(() => {
    if (!nameState.ok) return;
    if (nameState.siteName) setPreviewName(nameState.siteName);
    if (nameState.siteNameFont) {
      setFontKey(parseSiteNameFontKey(nameState.siteNameFont));
    }
    router.refresh();
  }, [nameState, router]);
  const [logoState, logoFormAction, logoPending] = useActionState(updateSiteLogoAction, initial);
  const [deleteLogoState, deleteLogoFormAction, deleteLogoPending] = useActionState(
    deleteSiteLogoAction,
    initial,
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
        <Globe className="h-4 w-4 text-indigo-600" aria-hidden />
        홈페이지 이름 · 로고
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        공개 사이트 왼쪽 상단에 표시됩니다. 로고를 등록하면 이름 대신 로고가 보입니다.
      </p>

      <form action={nameFormAction} className="mt-4 max-w-lg space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">홈페이지 이름</span>
          <input
            name="site_name"
            type="text"
            required
            value={previewName}
            onChange={(e) => setPreviewName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
            placeholder="예: [ OO리서치 ]"
          />
          <span className="mt-1 block text-xs text-zinc-500">
            로고가 없을 때 표시되며, 로고 이미지의 대체 텍스트(alt)에도 사용됩니다.
          </span>
        </label>

        <SiteNameFontField
          fontKey={fontKey}
          onFontChange={setFontKey}
          previewText={previewName}
        />

        <ActionMessage state={nameState} />
        <button
          type="submit"
          disabled={namePending}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {namePending ? "저장 중…" : "이름·글꼴 저장"}
        </button>
      </form>

      <div className="mt-6 border-t border-zinc-100 pt-6">
        <p className="text-sm font-medium text-zinc-800">로고 이미지</p>
        <p className="mt-1 text-xs text-zinc-500">
          JPG, PNG, GIF, WEBP · 최대 10MB · 가로형 로고 권장
        </p>

        {initialLogoUrl ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initialLogoUrl}
                alt={initialName}
                className="h-10 max-w-[12rem] object-contain object-left sm:h-12"
              />
            </div>
            <form action={deleteLogoFormAction}>
              <ActionMessage state={deleteLogoState} />
              <button
                type="submit"
                disabled={deleteLogoPending}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deleteLogoPending ? "삭제 중…" : "로고 삭제"}
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">등록된 로고가 없습니다.</p>
        )}

        <form action={logoFormAction} className="mt-4 max-w-lg space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">
              {initialLogoUrl ? "로고 변경" : "로고 업로드"}
            </span>
            <input
              name="file"
              type="file"
              required
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200"
            />
          </label>
          <ActionMessage state={logoState} />
          <button
            type="submit"
            disabled={logoPending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {logoPending ? "업로드 중…" : initialLogoUrl ? "로고 변경" : "로고 업로드"}
          </button>
        </form>
      </div>
    </section>
  );
}

type LinkMode = "cms" | "existing";

function NavItemCreateForm({
  groupKey,
  onDone,
}: {
  groupKey: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(createNavItemAction, initial);
  const [linkMode, setLinkMode] = useState<LinkMode>("cms");

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
      <input type="hidden" name="group_key" value={groupKey} />
      {linkMode === "cms" ? <input type="hidden" name="create_page" value="on" /> : null}
      <p className="text-sm font-medium text-zinc-800">새 하위 메뉴</p>
      <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2.5 text-xs leading-relaxed text-blue-950">
        <p className="font-semibold">연결 방식 안내</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>
            <strong>새 콘텐츠 페이지</strong>: 회사 소개 글처럼 관리자에서 본문을 직접 쓰는
            페이지입니다. 링크 경로는 자동으로 <code className="rounded bg-white/80 px-1">/p/영문주소</code>
            가 됩니다.
          </li>
          <li>
            <strong>기존 경로 연결</strong>: 이미 있는 화면(진행중 설문, 서비스 등)으로
            메뉴만 연결합니다. <code className="rounded bg-white/80 px-1">/surveys</code>처럼{" "}
            <strong>슬래시(/)로 시작</strong>하는 주소를 입력하세요.
          </li>
        </ul>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">메뉴 이름</span>
        <input
          name="label"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          placeholder="예: 회사 연혁"
        />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-700">연결 방식</legend>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
          <input
            type="radio"
            name="link_mode_ui"
            checked={linkMode === "cms"}
            onChange={() => setLinkMode("cms")}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-zinc-900">새 콘텐츠 페이지 만들기</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              추천 · 회사 소개·연혁 등 글을 직접 작성할 때
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
          <input
            type="radio"
            name="link_mode_ui"
            checked={linkMode === "existing"}
            onChange={() => setLinkMode("existing")}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-zinc-900">기존 경로로 연결</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              예: /surveys (진행중 설문), /services (서비스 안내)
            </span>
          </span>
        </label>
      </fieldset>
      {linkMode === "cms" ? (
        <>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">페이지 제목 (선택)</span>
            <input name="page_title" className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">페이지 주소 (영문·숫자·하이픈)</span>
            <input
              name="page_slug"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="about-us"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              공개 주소 예: /p/service-guide — 비워 두면 메뉴 이름에서 자동 생성됩니다.
              이미 있는 주소와 겹치면 저장되지 않으니, 다른 영문 주소를 쓰거나 「기존 경로로
              연결」에서 /p/기존주소 를 연결하세요.
            </span>
          </label>
          <div className="block text-sm">
            <span className="font-medium text-zinc-700">페이지 본문</span>
            <PageBodyEditor rows={6} />
          </div>
        </>
      ) : (
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">링크 경로</span>
          <input
            name="href"
            required
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="/surveys"
          />
          <span className="mt-1 block text-xs text-zinc-500">
            반드시 / 로 시작합니다. 외부 사이트 주소(https://…)는 사용할 수 없습니다.
          </span>
        </label>
      )}
      <ActionMessage state={state} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "추가 중…" : "추가"}
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

function NavItemEditForm({
  itemId,
  initialLabel,
  initialHref,
  onDone,
}: {
  itemId: string;
  initialLabel: string;
  initialHref: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateNavItemAction, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
    >
      <input type="hidden" name="id" value={itemId} />
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">메뉴 이름</span>
        <input
          name="label"
          required
          defaultValue={initialLabel}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">링크 경로</span>
        <input
          name="href"
          required
          defaultValue={initialHref}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>
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

function PageEditForm({ page, onDone }: { page: SitePage; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateNavItemPageAction, initial);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
    >
      <input type="hidden" name="page_id" value={page.id} />
      <p className="text-xs text-zinc-500">
        공개 URL: <code>/p/{page.slug}</code>
      </p>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">페이지 제목</span>
        <input
          name="page_title"
          required
          defaultValue={page.title}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </label>
      <div className="block text-sm">
        <span className="font-medium text-zinc-700">본문</span>
        <PageBodyEditor pageId={page.id} defaultValue={page.body} rows={8} />
      </div>
      <ActionMessage state={state} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          본문 저장
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm">
          닫기
        </button>
      </div>
    </form>
  );
}

function DeleteNavItemButton({ id, label }: { id: string; label: string }) {
  const [state, formAction, pending] = useActionState(deleteNavItemAction, initial);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`「${label}」 메뉴를 삭제할까요?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
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
