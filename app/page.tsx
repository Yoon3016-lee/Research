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
      <main className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute right-10 bottom-10 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-14">
          {/* 히어로 */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                Research Homepage Hub
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900">
                연구·조사를 위한
                <span className="text-cyan-600"> 설문 허브</span>에 오신 것을 환영합니다.
              </h1>
              <p className="text-lg text-slate-600">
                참여자에게는 간편한 응답 경험을, 관리자와 마스터에게는 강력한 설문 설계·배포·분석 도구를 제공합니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/survey-plaza"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 shadow-md"
                >
                  설문 광장 바로가기
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/create-survey"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700 shadow-sm"
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
                  설문 만들기
                </Link>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  실시간 응답 집계
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  조건 분기·템플릿 지원
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  이미지·메일 배포 연동
                </div>
              </div>
            </div>

            <div className="w-full max-w-lg">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">현재 역할</p>
                    <p className="text-lg font-bold text-slate-900">
                      {user ? `${user.role} (${user.id})` : "로그인 필요"}
                    </p>
                  </div>
                  <div className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                    안전 인증
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">참여하기</p>
                      <p className="text-xs text-slate-500">진행 중 설문 탐색</p>
                    </div>
                    <Link
                      href="/survey-plaza"
                      className="text-cyan-600 hover:text-cyan-700 text-xs font-semibold"
                    >
                      이동
                    </Link>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">설문 만들기</p>
                      <p className="text-xs text-slate-500">관리자·마스터 전용</p>
                    </div>
                    <Link
                      href="/create-survey"
                      className="text-cyan-600 hover:text-cyan-700 text-xs font-semibold"
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
                      이동
                    </Link>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">결과 확인</p>
                      <p className="text-xs text-slate-500">응답 현황·통계</p>
                    </div>
                    <Link
                      href="/survey-analysis"
                      className="text-cyan-600 hover:text-cyan-700 text-xs font-semibold"
                    >
                      이동
                    </Link>
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
                  RLS 적용 · 서비스 롤 분리 · 안전한 이미지 스토리지
                </div>
              </div>
            </div>
          </div>

          {/* 핵심 기능 카드 */}
          <section className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "간편 참여",
                desc: "직원은 설문 광장에서 원하는 설문을 선택하고 바로 응답할 수 있습니다.",
                accent: "bg-cyan-100 text-cyan-800",
              },
              {
                title: "강력한 설계",
                desc: "조건 분기, 템플릿, 이미지 삽입, 다중 선택·순위 등 다양한 문항 타입을 지원합니다.",
                accent: "bg-emerald-100 text-emerald-800",
              },
              {
                title: "배포·분석",
                desc: "이메일 배포, 응답 통계, 주관식 모음 등 관리·마스터가 바로 활용 가능합니다.",
                accent: "bg-indigo-100 text-indigo-800",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}>
                  {item.title}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </section>

          {/* 진행 플로우 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {[
                { title: "1. 로그인 / 회원가입", desc: "역할에 맞춰 접근 권한을 자동 적용" },
                { title: "2. 설문 선택 또는 생성", desc: "참여자는 응답, 관리자·마스터는 설계·배포" },
                { title: "3. 응답 수집·분석", desc: "실시간 응답 확인, 통계/주관식 모음 제공" },
              ].map((step, idx) => (
                <div key={step.title} className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white shadow-md">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      <p className="text-xs text-slate-600">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA 섹션 */}
          <section className="rounded-2xl bg-slate-900 px-6 py-8 sm:px-10 sm:py-10 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-200">지금 시작하기</p>
                <h3 className="text-2xl font-bold">설문 생성부터 배포·분석까지 한 번에</h3>
                <p className="text-sm text-slate-200 mt-1">관리자·마스터는 바로 설문을 만들고, 직원은 설문 광장에서 참여하세요.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/create-survey"
                  className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
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
                  설문 만들기
                </Link>
                <Link
                  href="/survey-plaza"
                  className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60"
                >
                  설문 광장 보기
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
