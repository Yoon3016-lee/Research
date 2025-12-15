"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "직원" | "관리자" | "마스터";

export default function SignupPage() {
  const router = useRouter();

  const [signUpId, setSignUpId] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<Role>("직원");
  const [signUpVerificationCode, setSignUpVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roleOptions: Role[] = ["직원", "관리자", "마스터"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: signUpId.trim(),
          password: signUpPassword.trim(),
          role: signUpRole,
          verificationCode: signUpVerificationCode.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "회원가입에 실패했습니다.");
      }

      setMessage("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">회원가입</h1>
            <p className="text-slate-400">새 계정을 만드세요</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="signUpId" className="block text-sm font-medium text-slate-300 mb-2">
                ID
              </label>
              <input
                id="signUpId"
                type="text"
                value={signUpId}
                onChange={(e) => setSignUpId(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                placeholder="아이디를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="signUpPassword" className="block text-sm font-medium text-slate-300 mb-2">
                비밀번호
              </label>
              <input
                id="signUpPassword"
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="signUpRole" className="block text-sm font-medium text-slate-300 mb-2">
                계급
              </label>
              <select
                id="signUpRole"
                value={signUpRole}
                onChange={(e) => setSignUpRole(e.target.value as Role)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="signUpVerificationCode" className="block text-sm font-medium text-slate-300 mb-2">
                확인 코드
              </label>
              <input
                id="signUpVerificationCode"
                type="text"
                value={signUpVerificationCode}
                onChange={(e) => setSignUpVerificationCode(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                placeholder="확인 코드를 입력하세요"
              />
              <p className="mt-1 text-xs text-slate-400">
                {signUpRole === "직원" && "직원 계급의 기본 확인 코드를 입력하세요"}
                {signUpRole === "관리자" && "관리자 계급의 확인 코드를 입력하세요"}
                {signUpRole === "마스터" && "마스터 계급의 확인 코드를 입력하세요"}
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "회원가입 중..." : "회원가입"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
                로그인
              </Link>
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-slate-400 hover:text-white"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

