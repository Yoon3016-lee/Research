"use client";

import Link from "next/link";

export default function SurveyAnalysisPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">설문 결과 분석</h1>
              <p className="mt-2 text-slate-400">설문 결과를 분석하고 확인하세요</p>
            </div>
            <Link
              href="/"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-12 text-center">
          <p className="text-slate-400 text-lg">준비 중입니다...</p>
          <p className="text-slate-500 text-sm mt-2">
            설문 결과 분석 기능은 곧 제공될 예정입니다.
          </p>
        </div>
      </main>
    </div>
  );
}

