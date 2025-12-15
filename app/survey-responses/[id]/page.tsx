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
};

type Response = {
  id: string;
  employee: string;
  submittedAt: string;
  answers: Record<string, string>;
};

type Survey = {
  id: string;
  title: string;
  description?: string | null;
  questions: Question[];
  responses: Response[];
};

export default function SurveyResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"responses" | "statistics" | "subjective">("responses");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login?redirect=/survey-responses/" + surveyId);
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as User;
      if (parsedUser.role !== "마스터") {
        router.push("/unauthorized?redirect=/survey-responses/" + surveyId);
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      router.push("/login?redirect=/survey-responses/" + surveyId);
      return;
    }
  }, [router, surveyId]);

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

    if (surveyId && user) {
      void fetchSurvey();
    }
  }, [surveyId, user]);

  // 정렬된 질문 목록
  const sortedQuestions = survey
    ? [...survey.questions].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  // 필터링된 응답 목록
  const filteredResponses =
    selectedEmployee === "all"
      ? survey?.responses || []
      : survey?.responses.filter((r) => r.employee === selectedEmployee) || [];

  // 고유한 직원 목록
  const uniqueEmployees = survey
    ? Array.from(new Set(survey.responses.map((r) => r.employee))).sort()
    : [];

  // 객관식 문항별 선택 횟수 통계
  const objectiveStatistics = useMemo(() => {
    if (!survey) return {};

    const stats: Record<
      string,
      {
        questionPrompt: string;
        questionType: string;
        options: Record<string, number>;
      }
    > = {};

    sortedQuestions.forEach((question) => {
      if (
        question.type.startsWith("객관식") &&
        question.options &&
        question.options.length > 0
      ) {
        const optionCounts: Record<string, number> = {};
        question.options.forEach((opt) => {
          optionCounts[opt] = 0;
        });

        survey.responses.forEach((response) => {
          const answer = response.answers[question.id];
          if (answer) {
            if (question.type === "객관식(다중선택)") {
              // 다중선택: 쉼표로 구분된 값들
              answer.split(",").forEach((val) => {
                const trimmed = val.trim();
                if (optionCounts[trimmed] !== undefined) {
                  optionCounts[trimmed]++;
                }
              });
            } else if (question.type === "객관식(순위선택)") {
              // 순위선택: 순위 값들(1,2,3...)이 쉼표로 구분되어 있음
              // 순위선택의 경우, 어떤 옵션이 선택되었는지는 저장되지 않고 순위 값만 저장됨
              // 따라서 각 옵션이 선택된 횟수를 정확히 카운트할 수 없음
              // 대신 응답 수를 카운트하거나, 선택된 옵션 수를 표시
              const rankValues = answer.split(",").filter((v) => v.trim());
              if (rankValues.length > 0) {
                // 순위선택은 응답 수를 카운트 (각 응답마다 여러 옵션을 선택할 수 있음)
                // 하지만 어떤 옵션이 선택되었는지는 알 수 없으므로, 전체 응답 수만 표시
                optionCounts["응답 수"] = (optionCounts["응답 수"] || 0) + 1;
                optionCounts["선택된 옵션 수"] = (optionCounts["선택된 옵션 수"] || 0) + rankValues.length;
              }
            } else {
              // 단일선택, 드롭다운
              const trimmed = answer.trim();
              if (optionCounts[trimmed] !== undefined) {
                optionCounts[trimmed]++;
              }
            }
          }
        });

        stats[question.id] = {
          questionPrompt: question.prompt,
          questionType: question.type,
          options: optionCounts,
        };
      }
    });

    return stats;
  }, [survey, sortedQuestions]);

  // 주관식 답변 모음
  const subjectiveAnswers = useMemo(() => {
    if (!survey) return {};

    const subjective: Record<
      string,
      {
        questionPrompt: string;
        questionType: string;
        answers: Array<{ employee: string; answer: string; submittedAt: string }>;
      }
    > = {};

    sortedQuestions.forEach((question) => {
      if (question.type === "단답형" || question.type === "서술형") {
        const answers: Array<{ employee: string; answer: string; submittedAt: string }> = [];

        survey.responses.forEach((response) => {
          const answer = response.answers[question.id];
          if (answer && answer.trim()) {
            answers.push({
              employee: response.employee,
              answer: answer.trim(),
              submittedAt: response.submittedAt,
            });
          }
        });

        if (answers.length > 0) {
          subjective[question.id] = {
            questionPrompt: question.prompt,
            questionType: question.type,
            answers,
          };
        }
      }
    });

    return subjective;
  }, [survey, sortedQuestions]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">인증 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {survey && (
                <>
                  <h1 className="text-3xl font-bold text-slate-900">{survey.title} - 응답 확인</h1>
                  {survey.description && (
                    <p className="mt-2 text-slate-600">{survey.description}</p>
                  )}
                </>
              )}
            </div>
            <Link
              href="/my-surveys"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
            >
              my설문함으로
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">설문 응답을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            {error}
          </div>
        ) : survey ? (
          <div className="space-y-6">
            {/* 탭 메뉴 */}
            <div className="flex gap-2 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("responses")}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === "responses"
                    ? "border-b-2 border-cyan-500 text-cyan-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                type="button"
              >
                개별 응답
              </button>
              <button
                onClick={() => setActiveTab("statistics")}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === "statistics"
                    ? "border-b-2 border-cyan-500 text-cyan-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                type="button"
              >
                객관식 통계
              </button>
              <button
                onClick={() => setActiveTab("subjective")}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === "subjective"
                    ? "border-b-2 border-cyan-500 text-cyan-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                type="button"
              >
                주관식 답변
              </button>
            </div>

            {/* 개별 응답 탭 */}
            {activeTab === "responses" && (
              <>
                {/* 필터 */}
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 mb-2">응답 통계</h2>
                      <p className="text-slate-600">
                        총 응답 수: <strong>{survey.responses.length}건</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-slate-700">직원 필터:</label>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="all">전체</option>
                        {uniqueEmployees.map((employee) => (
                          <option key={employee} value={employee}>
                            {employee}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedEmployee !== "all" && (
                    <p className="text-sm text-slate-600">
                      선택된 직원 응답 수: <strong>{filteredResponses.length}건</strong>
                    </p>
                  )}
                </div>

                {/* 응답 목록 */}
                {filteredResponses.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-slate-600">응답이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredResponses.map((response, responseIndex) => (
                  <div
                    key={response.id}
                    className="rounded-lg border border-slate-200 bg-white p-6"
                  >
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          응답 #{responseIndex + 1}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          직원: <strong>{response.employee}</strong> | 제출일:{" "}
                          {new Date(response.submittedAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                    </div>

                    {/* 질문별 답변 */}
                    <div className="space-y-4">
                      {sortedQuestions.map((question, qIndex) => {
                        const answer = response.answers[question.id];
                        const questionOptions = question.options || [];

                        return (
                          <div
                            key={question.id}
                            className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                          >
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">
                              {qIndex + 1}. {question.prompt} ({question.type})
                            </h4>
                            <div className="text-slate-700">
                              {answer ? (
                                <div>
                                  {/* 객관식(다중선택) 또는 순위선택인 경우 쉼표로 구분된 값 처리 */}
                                  {question.type === "객관식(다중선택)" ? (
                                    <div className="space-y-1">
                                      {answer.split(",").map((val, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <span className="text-cyan-600">✓</span>
                                          <span>{val.trim()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : question.type === "객관식(순위선택)" ? (
                                    <div className="space-y-1">
                                      {(() => {
                                        // 순위선택의 경우, 저장된 답변은 순위 값들(1,2,3...)이 쉼표로 구분되어 있음
                                        // 순위 값의 개수만큼 옵션이 선택되었다는 의미
                                        const rankValues = answer.split(",").map((v) => v.trim()).filter(Boolean);
                                        if (rankValues.length > 0) {
                                          // 순위 값들을 표시 (옵션 이름은 알 수 없으므로 순위만 표시)
                                          return rankValues.map((rank, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                              <span className="text-cyan-600 font-semibold">
                                                순위 {rank}
                                              </span>
                                            </div>
                                          ));
                                        }
                                        return <p className="text-slate-400 italic">답변 없음</p>;
                                      })()}
                                    </div>
                                  ) : (
                                    <p className="font-medium">{answer}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-slate-400 italic">답변 없음</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  ))}
                </div>
                )}
              </>
            )}

            {/* 객관식 통계 탭 */}
            {activeTab === "statistics" && (
              <div className="space-y-6">
                {Object.keys(objectiveStatistics).length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-slate-600">객관식 문항이 없습니다.</p>
                  </div>
                ) : (
                  Object.entries(objectiveStatistics).map(([questionId, stats]) => {
                    const totalCount = Object.values(stats.options).reduce((sum, count) => sum + count, 0);
                    return (
                      <div
                        key={questionId}
                        className="rounded-lg border border-slate-200 bg-white p-6"
                      >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          {stats.questionPrompt} ({stats.questionType})
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(stats.options).map(([option, count]) => {
                            const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
                            return (
                              <div key={option} className="flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700">{option}</span>
                                    <span className="text-sm text-slate-600">
                                      {count}건 ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                      className="bg-cyan-500 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-600">
                            총 응답 수: <strong>{totalCount}건</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 주관식 답변 탭 */}
            {activeTab === "subjective" && (
              <div className="space-y-6">
                {Object.keys(subjectiveAnswers).length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-slate-600">주관식 문항이 없거나 답변이 없습니다.</p>
                  </div>
                ) : (
                  Object.entries(subjectiveAnswers).map(([questionId, data]) => (
                    <div
                      key={questionId}
                      className="rounded-lg border border-slate-200 bg-white p-6"
                    >
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        {data.questionPrompt} ({data.questionType})
                      </h3>
                      <div className="space-y-3">
                        {data.answers.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">
                                {item.employee}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(item.submittedAt).toLocaleString("ko-KR")}
                              </span>
                            </div>
                            <p className="text-slate-900 whitespace-pre-wrap">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          총 답변 수: <strong>{data.answers.length}건</strong>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

