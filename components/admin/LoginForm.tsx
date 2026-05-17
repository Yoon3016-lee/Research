"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "@/app/actions/admin-auth";

const initial: AuthActionState = {};

type Props = {
  nextPath: string;
};

export function LoginForm({ nextPath }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          아이디 (이메일)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
          placeholder="name@company.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "처리 중…" : "로그인"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        계정이 없으신가요?{" "}
        <Link href="/admin/signup" className="font-medium text-indigo-700 hover:text-indigo-900">
          관리자 회원가입
        </Link>
      </p>
    </form>
  );
}
