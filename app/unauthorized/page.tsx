"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type User = {
  id: string;
  role: "직원" | "관리자" | "마스터";
};

function UnauthorizedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        
        // 권한이 있는 경우 해당 페이지로 리다이렉트
        const redirect = searchParams.get("redirect");
        if (redirect && (parsedUser.role === "관리자" || parsedUser.role === "마스터")) {
          router.push(redirect);
          return;
        }
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
    setIsChecking(false);
  }, [router, searchParams]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">권한이 없습니다</h1>
            <p className="text-slate-600">
              {user ? (
                <>
                  현재 계정({user.id})은 <strong>{user.role}</strong> 권한입니다.
                  <br />
                  이 기능을 사용하려면 <strong>관리자</strong> 또는 <strong>마스터</strong> 권한이 필요합니다.
                </>
              ) : (
                "이 기능을 사용하려면 로그인이 필요합니다."
              )}
            </p>
          </div>

          <div className="space-y-3">
            {!user && (
              <Link
                href="/login"
                className="block w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
              >
                로그인하기
              </Link>
            )}
            <Link
              href="/"
              className="block w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
            >
              홈으로 이동하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">로딩 중...</p>
      </div>
    }>
      <UnauthorizedPageContent />
    </Suspense>
  );
}

