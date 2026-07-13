"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CheckCircle2, KeyRound, LayoutList, Rows3 } from "lucide-react";
import {
  changePasswordAction,
  updateSurveyViewModeAction,
} from "@/app/actions/user-settings";
import {
  SURVEY_VIEW_MODE_DESCRIPTIONS,
  SURVEY_VIEW_MODE_LABELS,
  type SurveyViewMode,
} from "@/lib/survey-view-mode";

type Props = {
  email: string;
  roleLabel: string;
  initialViewMode: SurveyViewMode;
};

const MODE_ICONS: Record<SurveyViewMode, typeof LayoutList> = {
  paged: LayoutList,
  scroll: Rows3,
};

export function MyPageSettings({ email, roleLabel, initialViewMode }: Props) {
  const [viewMode, setViewMode] = useState<SurveyViewMode>(initialViewMode);
  const [modeNotice, setModeNotice] = useState<string | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);
  const [modePending, startMode] = useTransition();

  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwPending, startPw] = useTransition();

  const chooseMode = (mode: SurveyViewMode) => {
    if (mode === viewMode || modePending) return;
    const prev = viewMode;
    setViewMode(mode);
    setModeError(null);
    setModeNotice(null);
    startMode(async () => {
      const result = await updateSurveyViewModeAction(mode);
      if (!result.ok) {
        setViewMode(prev);
        setModeError(result.error);
        return;
      }
      setModeNotice(`설문 진행 방식을 「${SURVEY_VIEW_MODE_LABELS[mode]}」(으)로 저장했습니다.`);
    });
  };

  const handlePasswordChange = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startPw(async () => {
      const result = await changePasswordAction(fd);
      if (!result.ok) {
        setPwError(result.error);
        return;
      }
      form.reset();
      setPwSuccess("비밀번호를 변경했습니다.");
    });
  };

  return (
    <div className="space-y-6">
      <section className="site-card p-6">
        <h2 className="text-base font-semibold text-brand-900">계정 정보</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-900/10 bg-white px-4 py-3">
            <dt className="text-xs font-medium text-brand-700/80">이메일</dt>
            <dd className="mt-0.5 text-sm font-semibold text-brand-900">{email}</dd>
          </div>
          <div className="rounded-xl border border-brand-900/10 bg-white px-4 py-3">
            <dt className="text-xs font-medium text-brand-700/80">역할</dt>
            <dd className="mt-0.5 text-sm font-semibold text-brand-900">{roleLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="site-card p-6">
        <h2 className="text-base font-semibold text-brand-900">설문 진행 방식</h2>
        <p className="mt-1 text-sm text-brand-700">
          설문 참여 화면에서 문항을 보는 방식을 선택합니다. 선택 즉시 저장되며, 다음 설문부터
          적용됩니다.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["paged", "scroll"] as SurveyViewMode[]).map((mode) => {
            const Icon = MODE_ICONS[mode];
            const selected = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                disabled={modePending}
                aria-pressed={selected}
                onClick={() => chooseMode(mode)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-4 text-left transition disabled:opacity-60 ${
                  selected
                    ? "border-accent-500 bg-accent-500/10 ring-2 ring-accent-500/30"
                    : "border-brand-900/12 bg-white hover:border-accent-500/40 hover:bg-accent-500/5"
                }`}
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
                    selected ? "bg-accent-500/20 text-accent-700" : "bg-brand-900/6 text-brand-700"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
                    {SURVEY_VIEW_MODE_LABELS[mode]}
                    {selected ? (
                      <CheckCircle2 className="h-4 w-4 text-accent-600" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-brand-700/85">
                    {SURVEY_VIEW_MODE_DESCRIPTIONS[mode]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {modeError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {modeError}
          </p>
        ) : null}
        {modeNotice ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-700" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {modeNotice}
          </p>
        ) : null}
      </section>

      <section className="site-card p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-900">
          <KeyRound className="h-4 w-4 text-brand-700" aria-hidden />
          비밀번호 변경
        </h2>
        <form onSubmit={handlePasswordChange} className="mt-4 max-w-md space-y-3">
          <div>
            <label htmlFor="mypage-current" className="text-xs font-medium text-brand-800">
              현재 비밀번호
            </label>
            <input
              id="mypage-current"
              name="current_password"
              type="password"
              required
              autoComplete="current-password"
              className="site-input mt-1 text-sm"
            />
          </div>
          <div>
            <label htmlFor="mypage-new" className="text-xs font-medium text-brand-800">
              새 비밀번호 (8자 이상)
            </label>
            <input
              id="mypage-new"
              name="new_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="site-input mt-1 text-sm"
            />
          </div>
          <div>
            <label htmlFor="mypage-new2" className="text-xs font-medium text-brand-800">
              새 비밀번호 확인
            </label>
            <input
              id="mypage-new2"
              name="new_password2"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="site-input mt-1 text-sm"
            />
          </div>
          {pwError ? (
            <p className="text-sm text-red-600" role="alert">
              {pwError}
            </p>
          ) : null}
          {pwSuccess ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-700" role="status">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {pwSuccess}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pwPending}
            className="site-btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {pwPending ? "변경 중…" : "비밀번호 변경"}
          </button>
        </form>
      </section>
    </div>
  );
}
