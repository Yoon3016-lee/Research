"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogIn, LogOut, UserPlus, UserRound } from "lucide-react";
import { guestSignupAction, surveyLoginAction } from "@/app/actions/site-auth";
import type { SiteAuthResult } from "@/app/actions/site-auth";
import type { SurveyParticipant } from "@/lib/participant-types";

type Panel = "login" | "signup" | null;

type Props = {
  participant: SurveyParticipant;
  headerTheme?: "light" | "dark";
};

const btnOutlineDark =
  "site-header-btn inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:border-blue-300/40 hover:bg-white/15";

const btnPrimaryDark =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-400";

const btnOutlineLight =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-900/12 bg-white/90 px-3 py-2 text-sm font-medium text-brand-800 shadow-sm transition hover:border-accent-500/40 hover:bg-white";

const btnPrimaryLight =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-b from-brand-800 to-brand-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-brand-700 hover:to-brand-800";

function getAuthError(result: SiteAuthResult): string | null {
  return result.error ?? null;
}

function getAuthRedirect(result: SiteAuthResult): string | null {
  return result.redirectTo ?? null;
}

export function SiteAuthNav({ participant, headerTheme = "light" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const returnPath = pathname || "/";
  const containerRef = useRef<HTMLDivElement>(null);
  const dark = headerTheme === "dark";
  const btnOutline = dark ? btnOutlineDark : btnOutlineLight;
  const btnPrimary = dark ? btnPrimaryDark : btnPrimaryLight;

  const [panel, setPanel] = useState<Panel>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [loginPending, startLogin] = useTransition();
  const [signupPending, startSignup] = useTransition();
  const [logoutPending, startLogout] = useTransition();

  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanel(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel]);

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
        setPanel(null);
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
        setPanel(null);
        router.push(to);
        router.refresh();
      }
    });
  };

  const handleLogout = () => {
    startLogout(async () => {
      const fd = new FormData();
      fd.set("next", returnPath);
      try {
        const { surveyLogoutAction } = await import("@/app/actions/site-auth");
        const { redirectTo } = await surveyLogoutAction(fd);
        window.location.assign(redirectTo);
      } catch {
        window.location.assign(returnPath);
      }
    });
  };

  const openPanel = (next: Panel) => {
    setLoginError(null);
    setSignupError(null);
    setPanel((current) => (current === next ? null : next));
  };

  if (participant.mode !== "anonymous") {
    const subtitle =
      participant.mode === "staff" ? participant.roleLabel : "게스트 계정";

    return (
      <div className="flex items-center gap-2">
        <Link href="/mypage" className={btnOutline} title="마이페이지">
          <UserRound className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden max-w-[10rem] truncate text-left leading-tight sm:inline">
            {participant.email}
          </span>
          <span className="sr-only">{subtitle}</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutPending}
          className={btnOutline}
          aria-label="로그아웃"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{logoutPending ? "처리 중…" : "로그아웃"}</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => openPanel("login")}
        className={btnOutline}
        aria-expanded={panel === "login"}
        aria-haspopup="dialog"
      >
        <LogIn className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">로그인</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-60 transition ${panel === "login" ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <button
        type="button"
        onClick={() => openPanel("signup")}
        className={btnPrimary}
        aria-expanded={panel === "signup"}
        aria-haspopup="dialog"
      >
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">회원가입</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition ${panel === "signup" ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {panel === "login" ? (
        <AuthPopover title="로그인" onClose={() => setPanel(null)}>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="hidden" name="next" value={returnPath} />
            <p className="text-xs text-brand-700">
              직원·게스트 계정 모두 동일하게 로그인합니다.
            </p>
            <AuthFields idPrefix="site-login" />
            {loginError ? (
              <p className="text-sm text-red-600" role="alert">
                {loginError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loginPending}
              className="w-full admin-btn-primary py-2.5 disabled:opacity-60"
            >
              {loginPending ? "처리 중…" : "로그인"}
            </button>
            <p className="text-center text-xs text-brand-700/80">
              직원 계정이 없으면{" "}
              <Link
                href={`/admin/signup?next=${encodeURIComponent(returnPath)}`}
                className="admin-link hover:underline"
                onClick={() => setPanel(null)}
              >
                직원 회원가입
              </Link>
            </p>
          </form>
        </AuthPopover>
      ) : null}

      {panel === "signup" ? (
        <AuthPopover title="게스트 회원가입" onClose={() => setPanel(null)}>
          <form onSubmit={handleSignup} className="space-y-3">
            <input type="hidden" name="next" value={returnPath} />
            <p className="text-xs text-brand-700">
              가입키 없이 게스트 계정을 만듭니다. 설문 참여 시 작업량에 반영됩니다.
            </p>
            <AuthFields idPrefix="site-signup" withConfirm />
            {signupError ? (
              <p className="text-sm text-red-600" role="alert">
                {signupError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={signupPending}
              className="w-full site-btn-primary py-2.5 text-sm disabled:opacity-60"
            >
              {signupPending ? "처리 중…" : "가입하기"}
            </button>
          </form>
        </AuthPopover>
      ) : null}
    </div>
  );
}

function AuthPopover({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-brand-900/10 bg-white p-4 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-brand-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-brand-700/80 hover:text-brand-900"
        >
          닫기
        </button>
      </div>
      {children}
    </div>
  );
}

function AuthFields({
  idPrefix,
  withConfirm = false,
}: {
  idPrefix: string;
  withConfirm?: boolean;
}) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-email`} className="text-xs font-medium text-brand-800">
          이메일
        </label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          className="site-input mt-1 text-sm"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-password`} className="text-xs font-medium text-brand-800">
          비밀번호
        </label>
        <input
          id={`${idPrefix}-password`}
          name="password"
          type="password"
          required
          autoComplete={withConfirm ? "new-password" : "current-password"}
          className="site-input mt-1 text-sm"
        />
      </div>
      {withConfirm ? (
        <div>
          <label htmlFor={`${idPrefix}-password2`} className="text-xs font-medium text-brand-800">
            비밀번호 확인
          </label>
          <input
            id={`${idPrefix}-password2`}
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className="site-input mt-1 text-sm"
          />
        </div>
      ) : null}
    </>
  );
}
