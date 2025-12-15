"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  role: "직원" | "관리자" | "마스터";
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showParticipateDropdown, setShowParticipateDropdown] = useState(false);
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 네비게이션 바 */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* 왼쪽: 로고 및 메뉴 */}
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-slate-900">
                리서치 홈페이지 허브
              </Link>
              
              <div className="hidden md:flex items-center gap-6">
                {/* 설문지 생성하기 */}
                <Link
                  href="/create-survey"
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      router.push("/login?redirect=/create-survey");
                    } else if (user.role !== "관리자" && user.role !== "마스터") {
                      e.preventDefault();
                      router.push("/unauthorized");
                    }
                  }}
                >
                  설문지 생성하기
                </Link>

                {/* 참여하기 드롭다운 */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    setShowParticipateDropdown(true);
                    setShowLibraryDropdown(false);
                  }}
                  onMouseLeave={() => setShowParticipateDropdown(false)}
                >
                  <button
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    type="button"
                  >
                    참여하기
                    <svg
                      className={`h-4 w-4 transition-transform ${showParticipateDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showParticipateDropdown && (
                    <div 
                      className="absolute top-full left-0 pt-1 w-48 rounded-md bg-white shadow-2xl z-[9999] border border-slate-200"
                      onMouseEnter={() => setShowParticipateDropdown(true)}
                      onMouseLeave={() => setShowParticipateDropdown(false)}
                    >
                      <Link
                        href="/survey-plaza"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-t-md"
                      >
                        설문 광장
                      </Link>
                      <Link
                        href="/survey-analysis"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-b-md"
                      >
                        설문 결과 분석
                      </Link>
                    </div>
                  )}
                </div>

                {/* 라이브러리 드롭다운 */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    setShowLibraryDropdown(true);
                    setShowParticipateDropdown(false);
                  }}
                  onMouseLeave={() => setShowLibraryDropdown(false)}
                >
                  <button
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    type="button"
                  >
                    라이브러리
                    <svg
                      className={`h-4 w-4 transition-transform ${showLibraryDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showLibraryDropdown && (
                    <div 
                      className="absolute top-full left-0 pt-1 w-48 rounded-md bg-white shadow-2xl z-[9999] border border-slate-200"
                      onMouseEnter={() => setShowLibraryDropdown(true)}
                      onMouseLeave={() => setShowLibraryDropdown(false)}
                    >
                      <Link
                        href="/my-surveys"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-t-md"
                      >
                        my설문함
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 로그인/회원가입 또는 사용자 정보 */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-slate-700">
                    {user.id} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
                    type="button"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            설문조사 플랫폼에 오신 것을 환영합니다
          </h1>
          <p className="text-xl text-slate-600">
            다양한 설문에 참여하고, 나만의 설문을 만들어보세요
          </p>
        </div>
      </main>
    </div>
  );
}
