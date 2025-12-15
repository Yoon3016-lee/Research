"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Survey = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  deletedAt?: string | null;
  questions: Array<{
    id: string;
    prompt: string;
    type: string;
  }>;
};

export default function SurveyPlazaPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/surveys");
        if (!response.ok) {
          throw new Error("설문 목록을 불러오는데 실패했습니다.");
        }
        const result = await response.json();
        if (result.data) {
          // 삭제되지 않은 설문만 표시
          setSurveys((result.data as Survey[]).filter((s) => !s.deletedAt));
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSurveys();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">설문 광장</h1>
              <p className="mt-2 text-slate-600">진행 중인 설문에 참여해보세요</p>
            </div>
            <Link
              href="/"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">설문 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-red-300">
            {error}
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">진행 중인 설문이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* 이미지 영역 */}
                <div className="w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
                  {survey.imageUrl ? (
                    <img
                      src={survey.imageUrl}
                      alt={survey.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <svg
                        className="w-full h-full max-w-xs max-h-48"
                        viewBox="0 0 400 300"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* 책 배경 */}
                        <rect
                          x="80"
                          y="60"
                          width="240"
                          height="180"
                          rx="4"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth="3"
                        />
                        {/* 책 페이지들 */}
                        <line
                          x1="200"
                          y1="60"
                          x2="200"
                          y2="240"
                          stroke="#e2e8f0"
                          strokeWidth="2"
                        />
                        <line
                          x1="140"
                          y1="100"
                          x2="260"
                          y2="100"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="140"
                          y1="130"
                          x2="260"
                          y2="130"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="140"
                          y1="160"
                          x2="260"
                          y2="160"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="140"
                          y1="190"
                          x2="260"
                          y2="190"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="140"
                          y1="220"
                          x2="260"
                          y2="220"
                          stroke="#e2e8f0"
                          strokeWidth="1.5"
                        />
                        {/* 펜 */}
                        <g transform="translate(250, 80) rotate(45)">
                          {/* 펜 몸체 */}
                          <rect
                            x="0"
                            y="0"
                            width="60"
                            height="8"
                            rx="4"
                            fill="#3b82f6"
                          />
                          {/* 펜 끝 (촉) */}
                          <path
                            d="M60 0 L70 4 L60 8 Z"
                            fill="#1e40af"
                          />
                          {/* 펜 뚜껑 */}
                          <rect
                            x="-8"
                            y="-2"
                            width="12"
                            height="12"
                            rx="2"
                            fill="#60a5fa"
                          />
                        </g>
                        {/* 펜으로 쓰는 선 (글씨) */}
                        <path
                          d="M 150 120 Q 160 110, 170 115 T 190 120"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 150 150 Q 160 140, 170 145 T 190 150"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 150 180 Q 160 170, 170 175 T 190 180"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                    {survey.title}
                  </h3>
                {survey.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {survey.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                  <span>문항 수: {survey.questions.length}</span>
                  {survey.createdAt && (
                    <span>
                      {new Date(survey.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </div>
                  <Link
                    href={`/survey/${survey.id}`}
                    className="block w-full rounded-lg bg-cyan-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-cyan-600"
                  >
                    참여하기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

