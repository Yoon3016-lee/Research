"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  role: "직원" | "관리자" | "마스터";
};

type Question = {
  id: string;
  prompt: string;
  type: string;
  options?: string[];
  sortOrder?: number;
  conditionalLogic?: Record<string, string>;
};

type Survey = {
  id: string;
  title: string;
  description?: string | null;
  questions: Question[];
};

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [employeeAnswers, setEmployeeAnswers] = useState<Record<string, string | string[]>>({});
  const [rankSelections, setRankSelections] = useState<Record<string, string[]>>({});

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

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/surveys");
        if (!response.ok) {
          throw new Error("설문을 불러오는데 실패했습니다.");
        }
        const result = await response.json();
        if (result.data) {
          const foundSurvey = result.data.find((s: Survey) => s.id === surveyId);
          if (foundSurvey) {
            setSurvey(foundSurvey);
          } else {
            setError("설문을 찾을 수 없습니다.");
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    if (surveyId) {
      void fetchSurvey();
    }
  }, [surveyId]);

  // 조건부 로직에 따라 보이는 질문 계산
  const visibleQuestions = useMemo(() => {
    if (!survey) return [];
    
    const visible: Question[] = [];
    const answeredQuestions = new Set<string>();

    const checkQuestion = (question: Question) => {
      // 이미 처리한 질문이면 스킵
      if (visible.some((q) => q.id === question.id)) return;

      // 조건부 로직이 있는 경우
      if (question.conditionalLogic && Object.keys(question.conditionalLogic).length > 0) {
        // 이전 질문의 답변을 확인
        const parentQuestion = survey.questions.find(
          (q) => Object.values(question.conditionalLogic || {}).includes(q.id)
        );
        
        if (parentQuestion) {
          const parentAnswer = employeeAnswers[parentQuestion.id];
          const shouldShow = Object.entries(question.conditionalLogic || {}).some(
            ([option, targetId]) => {
              if (targetId === question.id) {
                if (Array.isArray(parentAnswer)) {
                  return parentAnswer.includes(option);
                }
                return parentAnswer === option;
              }
              return false;
            }
          );

          if (!shouldShow) return;
        }
      }

      visible.push(question);
      answeredQuestions.add(question.id);

      // 이 질문의 답변이 다른 질문을 트리거하는지 확인
      const answer = employeeAnswers[question.id];
      if (answer && question.conditionalLogic) {
        const targetQuestionId = Array.isArray(answer)
          ? question.conditionalLogic[answer[0]]
          : question.conditionalLogic[answer];

        if (targetQuestionId) {
          const targetQuestion = survey.questions.find((q) => q.id === targetQuestionId);
          if (targetQuestion) {
            checkQuestion(targetQuestion);
          }
        }
      }
    };

    // 정렬된 순서대로 처리
    const sortedQuestions = [...survey.questions].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    sortedQuestions.forEach((question) => {
      // 조건부 로직이 없거나 첫 번째 질문이면 표시
      if (!question.conditionalLogic || Object.keys(question.conditionalLogic).length === 0) {
        checkQuestion(question);
      } else if (visible.length === 0) {
        // 첫 번째 질문이 조건부 로직이 있어도 표시
        checkQuestion(question);
      }
    });

    return visible;
  }, [survey, employeeAnswers]);

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setEmployeeAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSingleChoice = (questionId: string, option: string) => {
    handleAnswer(questionId, option);
  };

  const handleMultipleChoice = (questionId: string, option: string) => {
    const currentAnswers = (employeeAnswers[questionId] as string[]) || [];
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter((a) => a !== option)
      : [...currentAnswers, option];
    handleAnswer(questionId, newAnswers);
  };

  const handleRankSelection = (questionId: string, option: string) => {
    const currentRanks = rankSelections[questionId] || [];
    if (currentRanks.includes(option)) {
      // 이미 선택된 옵션이면 제거
      const newRanks = currentRanks.filter((r) => r !== option);
      setRankSelections((prev) => ({
        ...prev,
        [questionId]: newRanks,
      }));
      // 순위 재조정
      const rankValues = newRanks.map((_, idx) => (idx + 1).toString());
      handleAnswer(questionId, rankValues.join(","));
    } else {
      // 새로 선택하면 순위 추가
      const newRanks = [...currentRanks, option];
      setRankSelections((prev) => ({
        ...prev,
        [questionId]: newRanks,
      }));
      // 순위 값 생성
      const rankValues = newRanks.map((_, idx) => (idx + 1).toString());
      handleAnswer(questionId, rankValues.join(","));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!survey) {
      setError("설문 정보를 불러올 수 없습니다.");
      return;
    }

    // 필수 질문 확인
    for (const question of visibleQuestions) {
      if (!employeeAnswers[question.id]) {
        setError(`"${question.prompt}"에 대한 답변을 입력해주세요.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      // 답변을 문자열로 변환
      const answers: Record<string, string> = {};
      for (const [questionId, answer] of Object.entries(employeeAnswers)) {
        if (Array.isArray(answer)) {
          answers[questionId] = answer.join(",");
        } else {
          answers[questionId] = answer;
        }
      }

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyId: survey.id,
          employeeId: user.id,
          answers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "응답 제출에 실패했습니다.");
      }

      setMessage("설문 응답이 제출되었습니다!");
      setTimeout(() => {
        router.push("/survey-plaza");
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {survey && (
                <>
                  <h1 className="text-3xl font-bold text-slate-900">{survey.title}</h1>
                  {survey.description && (
                    <p className="mt-2 text-slate-600">{survey.description}</p>
                  )}
                </>
              )}
            </div>
            <Link
              href="/survey-plaza"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
            >
              설문 광장으로
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">설문을 불러오는 중...</p>
          </div>
        ) : error && !survey ? (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            {error}
          </div>
        ) : survey ? (
          <div className="space-y-6">
            {visibleQuestions.map((question, index) => {
              const answer = employeeAnswers[question.id];
              const questionOptions = question.options || [];

              return (
                <div
                  key={question.id}
                  className="rounded-lg border border-slate-200 bg-white p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {index + 1}. {question.prompt}
                  </h3>

                  {/* 객관식(단일) */}
                  {question.type === "객관식(단일)" && (
                    <div className="space-y-2">
                      {questionOptions.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answer === option}
                            onChange={() => handleSingleChoice(question.id, option)}
                            className="w-4 h-4 text-cyan-500"
                          />
                          <span className="text-slate-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* 객관식(다중선택) */}
                  {question.type === "객관식(다중선택)" && (
                    <div className="space-y-2">
                      {questionOptions.map((option) => {
                        const currentAnswers = (answer as string[]) || [];
                        const isChecked = currentAnswers.includes(option);
                        return (
                          <label
                            key={option}
                            className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleMultipleChoice(question.id, option)}
                              className="w-4 h-4 text-cyan-500"
                            />
                            <span className="text-slate-700">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 객관식(드롭다운) */}
                  {question.type === "객관식(드롭다운)" && (
                    <select
                      value={answer as string || ""}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">선택하세요</option>
                      {questionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 객관식(순위선택) */}
                  {question.type === "객관식(순위선택)" && (
                    <div className="space-y-2">
                      {questionOptions.map((option) => {
                        const currentRanks = rankSelections[question.id] || [];
                        const rankIndex = currentRanks.indexOf(option);
                        const rank = rankIndex >= 0 ? rankIndex + 1 : null;
                        return (
                          <button
                            key={option}
                            onClick={() => handleRankSelection(question.id, option)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                              rank
                                ? "border-cyan-500 bg-cyan-50"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                            type="button"
                          >
                            <span className="text-slate-700">{option}</span>
                            {rank && (
                              <span className="text-cyan-600 font-semibold">순위 {rank}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 단답형 */}
                  {question.type === "단답형" && (
                    <input
                      type="text"
                      value={(answer as string) || ""}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
                      placeholder="답변을 입력하세요"
                    />
                  )}

                  {/* 서술형 */}
                  {question.type === "서술형" && (
                    <textarea
                      value={(answer as string) || ""}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
                      placeholder="답변을 입력하세요"
                      rows={4}
                    />
                  )}
                </div>
              );
            })}

            {/* 제출 버튼 */}
            {visibleQuestions.length > 0 && (
              <div className="flex justify-end gap-4 pt-6">
                <Link
                  href="/survey-plaza"
                  className="rounded-lg bg-slate-200 px-6 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
                >
                  취소
                </Link>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || !user}
                  className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  {isSubmitting ? "제출 중..." : "제출하기"}
                </button>
              </div>
            )}

            {/* 에러/성공 메시지 */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700">
                {message}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
