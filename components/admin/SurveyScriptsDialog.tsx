"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, X } from "lucide-react";
import {
  updateSurveyResponseScriptAction,
  type SurveyScriptActionState,
} from "@/app/actions/survey-scripts";
import { SharedScriptsManager } from "@/components/admin/SharedScriptsManager";
import { AdminSurveyStatusBadge } from "@/components/admin/AdminSurveyIconActions";
import type { SharedResponseScript } from "@/lib/shared-scripts";
import type { SurveyScriptAdminRow } from "@/lib/survey-scripts-admin";

type Tab = "shared" | "survey";

type Props = {
  open: boolean;
  onClose: () => void;
  sharedScripts: SharedResponseScript[];
  surveyScripts: SurveyScriptAdminRow[];
};

export function SurveyScriptsDialog({
  open,
  onClose,
  sharedScripts,
  surveyScripts,
}: Props) {
  const [tab, setTab] = useState<Tab>("shared");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-brand-900/45 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-scripts-dialog-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(92vh,860px)] w-[min(98vw,960px)] flex-col overflow-hidden rounded-2xl border border-brand-900/10 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-900/8 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="survey-scripts-dialog-title"
              className="flex items-center gap-2 text-base font-semibold text-brand-900"
            >
              <FileText className="h-4 w-4 shrink-0 text-accent-600" aria-hidden />
              스크립트 관리
            </h2>
            <p className="mt-0.5 text-xs text-brand-700/80">
              공용 스크립트와 설문별 응답 스크립트를 확인·수정합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-700 hover:bg-brand-900/5"
            aria-label="닫기"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex shrink-0 gap-2 border-b border-brand-900/8 px-4 py-2 sm:px-5">
          <TabButton active={tab === "shared"} onClick={() => setTab("shared")}>
            공용 스크립트
          </TabButton>
          <TabButton active={tab === "survey"} onClick={() => setTab("survey")}>
            설문별 스크립트
          </TabButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === "shared" ? (
            <SharedScriptsManager scripts={sharedScripts} embedded />
          ) : (
            <SurveyScriptsEditor surveys={surveyScripts} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-brand-900/8 text-brand-900 shadow-[inset_0_0_0_1px_rgba(166,139,91,0.22)]"
          : "text-brand-700 hover:bg-brand-900/5 hover:text-brand-900"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

const scriptInitial: SurveyScriptActionState = {};

function SurveyScriptsEditor({ surveys }: { surveys: SurveyScriptAdminRow[] }) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState(surveys[0]?.slug ?? "");
  const selected = surveys.find((s) => s.slug === selectedSlug) ?? null;
  const [body, setBody] = useState(selected?.responseScript ?? "");

  useEffect(() => {
    setBody(selected?.responseScript ?? "");
  }, [selectedSlug, selected?.responseScript]);

  const [state, formAction, pending] = useActionState(
    async (_prev: SurveyScriptActionState, formData: FormData) => {
      const res = await updateSurveyResponseScriptAction(_prev, formData);
      if (res.ok) router.refresh();
      return res;
    },
    scriptInitial,
  );

  if (surveys.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-900/12 bg-surface/60 px-4 py-10 text-center text-sm text-brand-700">
        등록된 설문이 없습니다. 설문을 만든 뒤 설문별 스크립트를 작성할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,15rem)_1fr]">
      <div className="admin-card max-h-[min(60vh,520px)] overflow-y-auto p-2">
        <p className="px-2 py-1 text-xs font-medium text-brand-700/80">설문 선택</p>
        <ul className="mt-1 space-y-0.5">
          {surveys.map((survey) => {
            const active = survey.slug === selectedSlug;
            return (
              <li key={survey.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(survey.slug)}
                  className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    active
                      ? "bg-brand-900/8 font-medium text-brand-900"
                      : "text-brand-800 hover:bg-brand-900/5"
                  }`}
                >
                  <span className="line-clamp-2">{survey.title}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <AdminSurveyStatusBadge status={survey.status} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected ? (
        <div className="admin-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-brand-900">{selected.title}</h3>
              <p className="mt-0.5 text-xs text-brand-700/80">
                slug · <code className="font-mono">{selected.slug}</code>
              </p>
            </div>
            <Link
              href={{
                pathname: "/admin/surveys/edit",
                query: { slug: selected.slug },
              }}
              className="admin-link text-xs hover:underline"
            >
              설문 편집 →
            </Link>
          </div>
          <p className="mt-3 text-xs text-brand-700/80">
            직원이 이 설문에서 「Advisor Agent」 시 보이는 설문 전용 스크립트입니다.
          </p>
          <form action={formAction} className="mt-4 space-y-3">
            <input type="hidden" name="slug" value={selected.slug} />
            <label className="block">
              <span className="admin-label">스크립트 본문</span>
              <textarea
                name="response_script"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className="admin-input mt-1.5 font-mono text-[13px] leading-relaxed"
                placeholder="전화 조사 시 직원이 읽을 스크립트를 입력하세요."
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
            <button
              type="submit"
              disabled={pending}
              className="admin-btn-primary px-5 py-2.5 disabled:opacity-60"
            >
              {pending ? "저장 중…" : "스크립트 저장"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
