"use client";

import { useTransition } from "react";

type Props = {
  slug: string;
  surveyPath: string;
  className?: string;
};

/**
 * 설문 참여 화면 로그아웃.
 * router.refresh() 대신 전체 이동 — 로그아웃 후 RSC/웹팩 모듈 불일치 오류 방지.
 */
export function SurveyLogoutButton({ slug, surveyPath, className }: Props) {
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("slug", slug);
      fd.set("next", surveyPath);
      try {
        const { surveyLogoutAction } = await import("@/app/actions/site-auth");
        const { redirectTo } = await surveyLogoutAction(fd);
        window.location.assign(redirectTo);
      } catch {
        window.location.assign(surveyPath);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={
        className ??
        "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
      }
    >
      {pending ? "처리 중…" : "로그아웃"}
    </button>
  );
}
