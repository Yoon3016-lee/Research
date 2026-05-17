"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminAuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-zinc-900">화면을 불러오지 못했습니다</h1>
      <p className="mt-2 text-sm text-zinc-600">
        개발 서버 캐시가 꼬였거나 환경 변수가 잘못되었을 수 있습니다. 터미널에서 개발
        서버를 모두 종료한 뒤 <code className="rounded bg-zinc-100 px-1">npm run dev:clean</code>
        으로 다시 실행해 보세요.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
