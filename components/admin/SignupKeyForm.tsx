"use client";

import { useActionState } from "react";
import { updateSignupKeyAction, type AuthActionState } from "@/app/actions/admin-auth";

const initial: AuthActionState = {};

export function SignupKeyForm() {
  const [state, formAction, pending] = useActionState(updateSignupKeyAction, initial);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="signup_key" className="text-sm font-medium text-zinc-700">
          새 관리자 가입키
        </label>
        <input
          id="signup_key"
          name="signup_key"
          type="password"
          autoComplete="new-password"
          required
          minLength={4}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="signup_key_confirm" className="text-sm font-medium text-zinc-700">
          새 가입키 확인
        </label>
        <input
          id="signup_key_confirm"
          name="signup_key_confirm"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        />
      </div>
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
        className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "저장 중…" : "가입키 저장"}
      </button>
    </form>
  );
}
