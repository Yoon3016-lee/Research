"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createSurveyOptionTemplateAction,
  deleteSurveyOptionTemplateAction,
  updateSurveyOptionTemplateAction,
  type SurveyOptionTemplateActionState,
} from "@/app/actions/survey-option-templates";
import type { SurveyOptionTemplateSummary } from "@/lib/survey-option-template-types";

const initial: SurveyOptionTemplateActionState = {};

type Props = {
  templates: SurveyOptionTemplateSummary[];
};

export function SurveyOptionTemplatesManager({ templates }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(templates.length === 0);

  const editing = templates.find((t) => t.id === editingId) ?? null;

  return (
    <div className="space-y-8">
      <section className="admin-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand-900">등록된 보기 템플릿</h2>
            <p className="mt-1 text-sm text-brand-700">
              설문 문항 편집기의 「보기 자동완성」에서 불러올 수 있습니다. 보기는 한 줄에 하나씩
              입력하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowCreate(true);
            }}
            className="admin-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            새 템플릿
          </button>
        </div>

        {templates.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-brand-900/12 bg-surface/60 px-4 py-8 text-center text-sm text-brand-700">
            아직 저장된 템플릿이 없습니다. 「새 템플릿」으로 추가하세요.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-brand-900/8">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-brand-900">
                    <ListChecks className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                    {template.title}
                  </p>
                  <p className="mt-1 text-xs text-brand-700/80">보기 {template.options.length}개</p>
                  <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-brand-800">
                    {template.options.slice(0, 8).map((opt, i) => (
                      <li key={`${template.id}-${i}`}>{opt}</li>
                    ))}
                    {template.options.length > 8 ? (
                      <li className="list-none text-xs text-brand-700/70">
                        …외 {template.options.length - 8}개
                      </li>
                    ) : null}
                  </ul>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setEditingId(template.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand-900/12 px-3 py-1.5 text-xs font-medium text-brand-800 hover:bg-surface"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    편집
                  </button>
                  <DeleteTemplateButton id={template.id} title={template.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showCreate ? (
        <TemplateForm
          key="create"
          heading="새 보기 템플릿"
          action={createSurveyOptionTemplateAction}
          onCancel={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      ) : null}

      {editing ? (
        <TemplateForm
          key={editing.id}
          heading="보기 템플릿 편집"
          action={updateSurveyOptionTemplateAction}
          templateId={editing.id}
          initialTitle={editing.title}
          initialOptionsText={editing.options.join("\n")}
          onCancel={() => setEditingId(null)}
          onSuccess={() => setEditingId(null)}
        />
      ) : null}
    </div>
  );
}

function TemplateForm({
  heading,
  action,
  templateId,
  initialTitle = "",
  initialOptionsText = "",
  onCancel,
  onSuccess,
}: {
  heading: string;
  action: (formData: FormData) => Promise<SurveyOptionTemplateActionState>;
  templateId?: string;
  initialTitle?: string;
  initialOptionsText?: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: SurveyOptionTemplateActionState, formData: FormData) => {
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
    <section className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-brand-900">{heading}</h2>
      <form action={formAction} className="mt-4 space-y-4">
        {templateId ? <input type="hidden" name="id" value={templateId} /> : null}
        <label className="block">
          <span className="text-sm font-medium text-brand-900">템플릿 이름</span>
          <input
            name="title"
            required
            defaultValue={initialTitle}
            className="mt-1 w-full rounded-lg border border-brand-900/12 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            placeholder="예: 만족도 5점, 지역 목록"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-brand-900">보기 목록</span>
          <p className="mt-0.5 text-xs text-brand-700">
            한 줄에 보기 하나씩 입력합니다. 줄바꿈(\n) 기준으로 구분됩니다.
          </p>
          <textarea
            name="optionsText"
            required
            defaultValue={initialOptionsText}
            rows={8}
            className="mt-2 w-full rounded-lg border border-brand-900/12 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            placeholder={"예:\n서울\n부산\n대구\n인천"}
          />
        </label>
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="admin-btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="admin-btn-secondary px-4 py-2 text-sm"
          >
            취소
          </button>
        </div>
      </form>
    </section>
  );
}

function DeleteTemplateButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: SurveyOptionTemplateActionState, formData: FormData) => {
      const res = await deleteSurveyOptionTemplateAction(formData);
      if (res.ok) router.refresh();
      return res;
    },
    initial,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`「${title}」 템플릿을 삭제할까요?`)) {
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
        <p className="mt-1 text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
