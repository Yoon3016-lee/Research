"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createSharedScriptAction,
  deleteSharedScriptAction,
  updateSharedScriptAction,
  type SharedScriptActionState,
} from "@/app/actions/shared-scripts";
import type { SharedResponseScript } from "@/lib/shared-scripts";

const initial: SharedScriptActionState = {};

type Props = {
  scripts: SharedResponseScript[];
  /** 모달 등 좁은 영역에 넣을 때 */
  embedded?: boolean;
};

export function SharedScriptsManager({ scripts, embedded = false }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(scripts.length === 0);

  const editing = scripts.find((s) => s.id === editingId) ?? null;

  return (
    <div className={embedded ? "space-y-6" : "space-y-8"}>
      <section className={embedded ? "admin-card p-4 sm:p-5" : "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">등록된 공용 스크립트</h2>
            <p className="mt-1 text-sm text-zinc-500">
              직원이 어떤 설문에서든 「스크립트 확인」→ 「공용 스크립트」탭에서 볼 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowCreate(true);
            }}
            className={embedded ? "admin-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm" : "inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"}
          >
            <Plus className="h-4 w-4" aria-hidden />
            새 공용 스크립트
          </button>
        </div>

        {scripts.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
            아직 공용 스크립트가 없습니다. 위 버튼으로 추가하세요.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-100">
            {scripts.map((script) => (
              <li key={script.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-zinc-900">
                    <FileText className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                    {script.title}
                  </p>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-zinc-600">
                    {script.body.trim() || "(본문 없음)"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setEditingId(script.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    편집
                  </button>
                  <DeleteScriptButton id={script.id} title={script.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showCreate ? (
        <ScriptForm
          key="create"
          heading="새 공용 스크립트"
          action={createSharedScriptAction}
          embedded={embedded}
          onCancel={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      ) : null}

      {editing ? (
        <ScriptForm
          key={editing.id}
          heading="공용 스크립트 편집"
          action={updateSharedScriptAction}
          embedded={embedded}
          scriptId={editing.id}
          initialTitle={editing.title}
          initialBody={editing.body}
          onCancel={() => setEditingId(null)}
          onSuccess={() => setEditingId(null)}
        />
      ) : null}
    </div>
  );
}

function ScriptForm({
  heading,
  action,
  embedded = false,
  scriptId,
  initialTitle = "",
  initialBody = "",
  onCancel,
  onSuccess,
}: {
  heading: string;
  action: (formData: FormData) => Promise<SharedScriptActionState>;
  embedded?: boolean;
  scriptId?: string;
  initialTitle?: string;
  initialBody?: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: SharedScriptActionState, formData: FormData) => {
      const res = await action(formData);
      if (res.ok) {
        onSuccess();
        router.refresh();
      }
      return res;
    },
    initial,
  );

  return (
    <section className={embedded ? "admin-card p-4 sm:p-5" : "rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-6 shadow-sm"}>
      <h2 className="text-base font-semibold text-zinc-900">{heading}</h2>
      <form action={formAction} className="mt-4 space-y-4">
        {scriptId ? <input type="hidden" name="id" value={scriptId} /> : null}
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">제목 *</span>
          <input
            name="title"
            required
            defaultValue={initialTitle}
            placeholder="예: 전화 인사말, 거절 시 멘트"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">스크립트 본문</span>
          <textarea
            name="body"
            rows={12}
            defaultValue={initialBody}
            placeholder="모든 설문에서 공통으로 참고할 내용을 입력하세요."
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p className="text-sm text-emerald-700" role="status">
            저장했습니다.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            취소
          </button>
        </div>
      </form>
    </section>
  );
}

function DeleteScriptButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: SharedScriptActionState, formData: FormData) => {
      const res = await deleteSharedScriptAction(formData);
      if (res.ok) router.refresh();
      return res;
    },
    initial,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`「${title}」 공용 스크립트를 삭제할까요?`)) {
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
      {state.error ? (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
