"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthActionState } from "@/app/actions/admin-auth";

const initial: AuthActionState = {};

type Props = {
  nextPath?: string;
};

export function SignupForm({ nextPath = "/admin" }: Props) {
  const [state, formAction, pending] = useActionState(signupAction, initial);

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
          비밀번호 (8자 이상)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="password2" className="text-sm font-medium text-zinc-700">
          비밀번호 확인
        </label>
        <input
          id="password2"
          name="password2"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="signup_key" className="text-sm font-medium text-zinc-700">
          관리자 가입키
        </label>
        <input
          id="signup_key"
          name="signup_key"
          type="password"
          autoComplete="off"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
          placeholder="총관리자가 안내한 키"
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
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "처리 중…" : "회원가입"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        이미 계정이 있으신가요?{" "}
        <Link href="/admin/login" className="font-medium text-indigo-700 hover:text-indigo-900">
          로그인
        </Link>
      </p>
    </form>
  );
}
