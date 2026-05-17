"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  guestSignupAction,
  surveyLoginAction,
  surveyLogoutAction,
} from "@/app/actions/site-auth";
import type { SurveyParticipant } from "@/lib/participant-types";
import type { SiteAuthResult } from "@/app/actions/site-auth";

function getAuthError(result: SiteAuthResult): string | null {
  return result.error ?? null;
}

function getAuthRedirect(result: SiteAuthResult): string | null {
  return result.redirectTo ?? null;
}

type Props = {
  slug: string;
  participant: SurveyParticipant;
};

export function SurveyParticipantPanel({ slug, participant }: Props) {
  const router = useRouter();
  const surveyPath = `/survey/${slug}`;
  const [authTab, setAuthTab] = useState<"staff" | "guest_login" | "guest_signup" | null>(
    null,
  );
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [loginPending, startLogin] = useTransition();
  const [signupPending, startSignup] = useTransition();

  const showAuthForms = participant.mode === "anonymous" && authTab !== null;

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const fd = new FormData(e.currentTarget);
    startLogin(async () => {
      const res = await surveyLoginAction(fd);
      const err = getAuthError(res);
      if (err) {
        setLoginError(err);
        return;
      }
      const to = getAuthRedirect(res);
      if (to) {
        router.push(to);
        router.refresh();
      }
    });
  };

  const handleSignup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignupError(null);
    const fd = new FormData(e.currentTarget);
    startSignup(async () => {
      const res = await guestSignupAction(fd);
      const err = getAuthError(res);
      if (err) {
        setSignupError(err);
        return;
      }
      const to = getAuthRedirect(res);
      if (to) {
        router.push(to);
        router.refresh();
      }
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">참여자 확인</h2>
      <p className="mt-1 text-sm text-zinc-600">
        직원은 로그인하면 작업량에 집계됩니다. 게스트는 로그인 없이도 참여할 수 있습니다.
      </p>

      {participant.mode === "staff" ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-indigo-800">직원으로 참여 중</p>
            <p className="mt-0.5 text-sm font-semibold text-indigo-950">{participant.email}</p>
            <p className="text-xs text-indigo-800/80">{participant.roleLabel}</p>
          </div>
          <LogoutButton slug={slug} surveyPath={surveyPath} />
        </div>
      ) : null}

      {participant.mode === "guest_account" ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-zinc-600">게스트 계정으로 참여 중</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900">{participant.email}</p>
            <p className="text-xs text-zinc-500">게스트 작업량에 합산됩니다</p>
          </div>
          <LogoutButton slug={slug} surveyPath={surveyPath} />
        </div>
      ) : null}

      {participant.mode === "anonymous" ? (
        <>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
            <p className="text-sm font-medium text-amber-950">비로그인 게스트로 참여 중</p>
            <p className="mt-1 text-xs text-amber-900/90">
              제출 시 게스트 전체 작업량에 합산됩니다. 직원이시면 로그인해 주세요.
            </p>
          </div>

          {!showAuthForms ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setAuthTab("staff");
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                직원 로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setAuthTab("guest_login");
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                게스트 로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignupError(null);
                  setAuthTab("guest_signup");
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                게스트 회원가입
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
              <div className="flex flex-wrap gap-2">
                <TabButton
                  active={authTab === "staff"}
                  onClick={() => {
                    setLoginError(null);
                    setAuthTab("staff");
                  }}
                  label="직원 로그인"
                />
                <TabButton
                  active={authTab === "guest_login"}
                  onClick={() => {
                    setLoginError(null);
                    setAuthTab("guest_login");
                  }}
                  label="게스트 로그인"
                />
                <TabButton
                  active={authTab === "guest_signup"}
                  onClick={() => {
                    setSignupError(null);
                    setAuthTab("guest_signup");
                  }}
                  label="게스트 가입"
                />
                <button
                  type="button"
                  onClick={() => setAuthTab(null)}
                  className="ml-auto text-xs text-zinc-500 hover:text-zinc-800"
                >
                  닫기
                </button>
              </div>

              {authTab === "staff" || authTab === "guest_login" ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="next" value={surveyPath} />
                  <p className="text-xs text-zinc-600">
                    {authTab === "staff"
                      ? "관리자·직원 계정(가입키로 만든 계정)으로 로그인합니다."
                      : "게스트 계정으로 로그인합니다."}
                  </p>
                  <AuthFields />
                  {loginError ? (
                    <p className="text-sm text-red-600" role="alert">
                      {loginError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={loginPending}
                    className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {loginPending ? "처리 중…" : "로그인"}
                  </button>
                  {authTab === "staff" ? (
                    <p className="text-center text-xs text-zinc-500">
                      직원 계정이 없으면{" "}
                      <Link
                        href={`/admin/signup?next=${encodeURIComponent(surveyPath)}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        관리자 회원가입
                      </Link>
                    </p>
                  ) : null}
                </form>
              ) : null}

              {authTab === "guest_signup" ? (
                <form onSubmit={handleSignup} className="space-y-3">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="next" value={surveyPath} />
                  <p className="text-xs text-zinc-600">
                    가입키 없이 게스트 계정을 만듭니다. 제출은 게스트 작업량에 합산됩니다.
                  </p>
                  <AuthFields withConfirm />
                  {signupError ? (
                    <p className="text-sm text-red-600" role="alert">
                      {signupError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={signupPending}
                    className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {signupPending ? "처리 중…" : "게스트 가입"}
                  </button>
                </form>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-white text-indigo-800 shadow-sm ring-1 ring-indigo-200"
          : "text-zinc-600 hover:bg-white/80"
      }`}
    >
      {label}
    </button>
  );
}

function AuthFields({ withConfirm = false }: { withConfirm?: boolean }) {
  return (
    <>
      <div>
        <label htmlFor="survey-auth-email" className="text-xs font-medium text-zinc-700">
          이메일
        </label>
        <input
          id="survey-auth-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="survey-auth-password" className="text-xs font-medium text-zinc-700">
          비밀번호
        </label>
        <input
          id="survey-auth-password"
          name="password"
          type="password"
          required
          autoComplete={withConfirm ? "new-password" : "current-password"}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        />
      </div>
      {withConfirm ? (
        <div>
          <label htmlFor="survey-auth-password2" className="text-xs font-medium text-zinc-700">
            비밀번호 확인
          </label>
          <input
            id="survey-auth-password2"
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-indigo-500/30 focus:ring-2"
          />
        </div>
      ) : null}
    </>
  );
}

function LogoutButton({ slug, surveyPath }: { slug: string; surveyPath: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("slug", slug);
      fd.set("next", surveyPath);
      const { redirectTo } = await surveyLogoutAction(fd);
      router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
    >
      {pending ? "처리 중…" : "로그아웃"}
    </button>
  );
}
