"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  role: "직원" | "관리자" | "마스터";
};

type QuestionType =
  | "객관식(단일)"
  | "객관식(다중선택)"
  | "객관식(드롭다운)"
  | "객관식(순위선택)"
  | "단답형"
  | "서술형"
  | "복수형 주관식";

type Question = {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  conditionalLogic?: Record<string, string>;
  sortOrder: number;
  maxRank?: number;
  maxSelected?: number;
};

type QuestionTemplate = {
  id: string;
  name: string;
  question_type: "객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)";
  options: string[];
};

function CreateSurveyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSurveyId = searchParams.get("edit");

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 설문 데이터
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyImageUrl, setSurveyImageUrl] = useState<string>("");
  const [surveyImageFile, setSurveyImageFile] = useState<File | null>(null);
  const [surveyImagePreview, setSurveyImagePreview] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionTemplates, setQuestionTemplates] = useState<QuestionTemplate[]>([]);

  // UI 상태
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login?redirect=/create-survey");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as User;
      if (parsedUser.role !== "관리자" && parsedUser.role !== "마스터") {
        router.push("/unauthorized?redirect=/create-survey");
        return;
      }
      setUser(parsedUser);
      setIsCheckingAuth(false);
    } catch (e) {
      router.push("/login?redirect=/create-survey");
      return;
    }
  }, [router]);

  // 템플릿 불러오기
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/question-templates");
      if (!response.ok) {
        throw new Error("템플릿을 불러오는데 실패했습니다.");
      }
      const result = await response.json();
      setQuestionTemplates(result.data || []);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchTemplates();
    }
  }, [user, fetchTemplates]);

  // 수정 모드: 기존 설문 불러오기
  useEffect(() => {
    if (editSurveyId && user) {
      const loadSurvey = async () => {
        try {
          setIsLoading(true);
          const response = await fetch("/api/surveys");
          if (!response.ok) {
            throw new Error("설문을 불러오는데 실패했습니다.");
          }
          const result = await response.json();
          const survey = (result.data as Array<{
            id: string;
            title: string;
            description?: string | null;
            questions: Array<{
              id: string;
              prompt: string;
              type: string;
              options?: string[];
              conditionalLogic?: Record<string, string>;
              sortOrder?: number;
            }>;
          }>).find((s) => s.id === editSurveyId);

          if (survey) {
            setSurveyTitle(survey.title);
            setSurveyDescription(survey.description || "");
            setSurveyImageUrl((survey as { imageUrl?: string }).imageUrl || "");
            setSurveyImagePreview((survey as { imageUrl?: string }).imageUrl || "");
            setQuestions(
              survey.questions.map((q) => {
                const base: Question = {
                  id: q.id,
                  prompt: q.prompt,
                  type: q.type as QuestionType,
                  options: q.options || [],
                  conditionalLogic: q.conditionalLogic,
                  sortOrder: q.sortOrder || 0,
                };

                if (q.type === "객관식(순위선택)" && typeof (q as unknown as { maxRank?: number }).maxRank === "number") {
                  base.maxRank = (q as unknown as { maxRank: number }).maxRank;
                }

                if (q.type === "객관식(다중선택)" && typeof (q as unknown as { maxSelected?: number }).maxSelected === "number") {
                  base.maxSelected = (q as unknown as { maxSelected: number }).maxSelected;
                }

                return base;
              }),
            );
          }
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      void loadSurvey();
    }
  }, [editSurveyId, user]);

  const addQuestion = (type: QuestionType) => {
    let defaultOptions: string[] = [];

    if (type.startsWith("객관식")) {
      if (type === "객관식(순위선택)")
        defaultOptions = ["선택지 1", "선택지 2", "선택지 3"];
      else
        defaultOptions = [
          "매우 불만족",
          "불만족",
          "약간 불만족",
          "약간 만족",
          "만족",
          "매우 만족",
        ];
    } else if (type === "복수형 주관식") {
      defaultOptions = ["항목 1"];
    }

    const newQuestion: Question = {
      id: `temp-${Date.now()}-${Math.random()}`,
      prompt: "",
      type,
      options: defaultOptions,
      sortOrder: questions.length,
    };

    setQuestions([...questions, newQuestion]);
    setShowQuestionTypeModal(false);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q)),
    );
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options) {
      updateQuestion(questionIndex, {
        options: [...(question.options || []), ""],
      });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options) {
      updateQuestion(questionIndex, {
        options: question.options.filter((_, i) => i !== optionIndex),
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionIndex, { options: newOptions });
    }
  };

  const addConditionalLogic = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question.options || question.options.length === 0) {
      alert("먼저 옵션을 추가해주세요.");
      return;
    }
    setSelectedQuestionIndex(questionIndex);
  };

  const setConditionalTarget = (questionIndex: number, option: string, targetQuestionId: string) => {
    const question = questions[questionIndex];
    updateQuestion(questionIndex, {
      conditionalLogic: {
        ...(question.conditionalLogic || {}),
        [option]: targetQuestionId,
      },
    });
    setSelectedQuestionIndex(null);
  };

  const loadTemplate = (templateIndex: number) => {
    if (selectedTemplateIndex === null) return;
    const template = questionTemplates[templateIndex];
    const question = questions[selectedTemplateIndex];
    if (template && question && question.type === template.question_type) {
      updateQuestion(selectedTemplateIndex, { options: template.options });
    }
    setShowTemplateModal(false);
    setSelectedTemplateIndex(null);
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!surveyTitle.trim()) {
      setError("설문 제목을 입력해주세요.");
      return;
    }

    if (questions.length === 0) {
      setError("최소 1개 이상의 문항을 추가해주세요.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setError(`${i + 1}번 문항의 질문을 입력해주세요.`);
        return;
      }
      if (q.type.startsWith("객관식") && q.type !== "객관식(순위선택)" && (!q.options || q.options.length === 0)) {
        setError(`${i + 1}번 문항의 선택지를 추가해주세요.`);
        return;
      }
    }

    try {
      setIsLoading(true);

      const questionData = questions.map((q, index) => {
        // 객관식/복수형 주관식인 경우 options를 배열로 변환
        let options: string[] | undefined = undefined;
        if (q.type.startsWith("객관식") || q.type === "복수형 주관식") {
          options = q.options || [];
        }

        return {
          id: q.id.startsWith("temp-") ? undefined : q.id,
          prompt: q.prompt,
          type: q.type,
          options,
          sortOrder: index,
          conditionalLogic: q.conditionalLogic,
          maxRank: q.maxRank,
          maxSelected: q.maxSelected,
        } as {
          id?: string;
          prompt: string;
          type: QuestionType;
          options?: string[];
          sortOrder: number;
          conditionalLogic?: Record<string, string>;
          maxRank?: number;
          maxSelected?: number;
        };
      });

      const url = editSurveyId ? `/api/surveys/${editSurveyId}` : "/api/surveys";
      const method = editSurveyId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: surveyTitle.trim(),
          description: surveyDescription.trim() || null,
          imageUrl: surveyImageUrl || null,
          questions: questionData,
          createdBy: user?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "설문 저장에 실패했습니다.");
      }

      setMessage(editSurveyId ? "설문이 수정되었습니다." : "설문이 생성되었습니다.");
      setTimeout(() => {
        router.push("/my-surveys");
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">인증 확인 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {editSurveyId ? "설문지 수정" : "설문지 생성"}
              </h1>
              <p className="mt-2 text-slate-600">새로운 설문조사를 만들어보세요</p>
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
      <main className="mx-auto max-w-7xl py-12">
        <div className="flex gap-6">
          {/* 왼쪽 퀵메뉴 - 왼쪽 끝에 배치 */}
          <div className="w-80 flex-shrink-0 pl-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">문항 추가 퀵메뉴</h3>
              
              {/* 객관식 문항추가 구성 모음 - 한 줄에 4개 */}
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      addQuestion("객관식(단일)");
                    }}
                    className="rounded-lg bg-cyan-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                    type="button"
                  >
                    객관식(단일)
                  </button>
                  <button
                    onClick={() => {
                      addQuestion("객관식(다중선택)");
                    }}
                    className="rounded-lg bg-cyan-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                    type="button"
                  >
                    객관식(다중선택)
                  </button>
                  <button
                    onClick={() => {
                      addQuestion("객관식(드롭다운)");
                    }}
                    className="rounded-lg bg-cyan-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                    type="button"
                  >
                    객관식(드롭다운)
                  </button>
                  <button
                    onClick={() => {
                      addQuestion("객관식(순위선택)");
                    }}
                    className="rounded-lg bg-cyan-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                    type="button"
                  >
                    객관식(순위선택)
                  </button>
                </div>
              </div>

              {/* 주관식 문항추가 구성 모음 - 한 줄에 4개 */}
              <div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      addQuestion("단답형");
                    }}
                    className="rounded-lg bg-emerald-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    type="button"
                  >
                    단답형
                  </button>
                  <button
                    onClick={() => {
                      addQuestion("서술형");
                    }}
                    className="rounded-lg bg-emerald-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    type="button"
                  >
                    서술형
                  </button>
                  <button
                    onClick={() => {
                      addQuestion("복수형 주관식");
                    }}
                    className="rounded-lg bg-emerald-500 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    type="button"
                  >
                    복수형 주관식
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-1 space-y-6 pr-4 sm:pr-6 lg:pr-8">
          {/* 설문 제목 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              설문 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
              placeholder="설문 제목을 입력하세요"
            />
          </div>

          {/* 설문 설명 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              설문 설명
            </label>
            <textarea
              value={surveyDescription}
              onChange={(e) => setSurveyDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
              placeholder="설문 설명을 입력하세요 (선택사항)"
              rows={3}
            />
          </div>

          {/* 설문 이미지 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              설문 이미지 (로고)
            </label>
            <div className="space-y-4">
              {surveyImagePreview ? (
                <div className="relative">
                  <img
                    src={surveyImagePreview}
                    alt="설문 미리보기"
                    className="w-full h-48 object-cover rounded-lg border border-slate-300"
                  />
                  <button
                    onClick={() => {
                      setSurveyImagePreview("");
                      setSurveyImageUrl("");
                      setSurveyImageFile(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <p className="text-slate-500 mb-4">이미지를 업로드하세요</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSurveyImageFile(file);
                        // 미리보기 생성
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSurveyImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-cyan-600 transition"
                  >
                    이미지 선택
                  </label>
                </div>
              )}
              {surveyImageFile && !surveyImagePreview.includes("http") && (
                <button
                  onClick={async () => {
                    if (!surveyImageFile) return;
                    try {
                      setIsLoading(true);
                      const formData = new FormData();
                      formData.append("file", surveyImageFile);
                      const response = await fetch("/api/upload-image", {
                        method: "POST",
                        body: formData,
                      });
                      const result = await response.json();
                      if (!response.ok) {
                        throw new Error(result.error || "이미지 업로드에 실패했습니다.");
                      }
                      setSurveyImageUrl(result.url);
                      setSurveyImagePreview(result.url);
                      setMessage("이미지가 업로드되었습니다. 설문을 저장하면 이미지가 함께 저장됩니다.");
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  type="button"
                >
                  {isLoading ? "업로드 중..." : "이미지 업로드"}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              이미지가 없으면 기본 이미지가 사용됩니다.
            </p>
          </div>

            {/* 문항 목록 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">문항</h2>
              </div>

            {questions.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-slate-500">문항이 없습니다. &quot;문항 추가&quot; 버튼을 클릭하여 문항을 추가하세요.</p>
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          {index + 1}번 문항 ({question.type})
                        </span>
                        {question.type.startsWith("객관식") && question.type !== "객관식(순위선택)" && (
                          <button
                            onClick={() => {
                              setSelectedTemplateIndex(index);
                              setShowTemplateModal(true);
                            }}
                            className="text-xs text-cyan-600 hover:text-cyan-700"
                            type="button"
                          >
                            [템플릿 불러오기]
                          </button>
                        )}
                        <button
                          onClick={() => addConditionalLogic(index)}
                          className="text-xs text-purple-600 hover:text-purple-700"
                          type="button"
                        >
                          [조건 추가]
                        </button>
                      </div>
                      <input
                        type="text"
                        value={question.prompt}
                        onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none"
                        placeholder="질문을 입력하세요"
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="ml-4 text-red-500 hover:text-red-700"
                      type="button"
                    >
                      삭제
                    </button>
                  </div>

                  {/* 객관식 옵션 (단일/다중/드롭다운) */}
                  {question.type.startsWith("객관식") && question.type !== "객관식(순위선택)" && (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-700">선택지</label>
                          <button
                            onClick={() => addOption(index)}
                            className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
                            type="button"
                          >
                            + 선택지 추가
                          </button>
                        </div>
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optIndex, e.target.value)}
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                              placeholder={`선택지 ${optIndex + 1}`}
                            />
                            <button
                              onClick={() => removeOption(index, optIndex)}
                              className="text-red-500 hover:text-red-700"
                              type="button"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* 객관식(다중선택) 최대 선택 수 설정 */}
                      {question.type === "객관식(다중선택)" && (
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-slate-700">
                            최대 선택 수
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, question.options?.length || 1)}
                            value={
                              question.maxSelected && question.maxSelected > 0
                                ? question.maxSelected
                                : ""
                            }
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              if (Number.isNaN(raw) || raw <= 0) {
                                // 빈 값이나 0/음수면 제한 없음
                                updateQuestion(index, { maxSelected: undefined });
                                return;
                              }
                              const max = Math.max(1, question.options?.length || 1);
                              const clamped = Math.min(Math.max(1, raw), max);
                              updateQuestion(index, { maxSelected: clamped });
                            }}
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none text-center"
                          />
                          <span className="text-sm text-slate-600">개 (빈칸이면 제한 없음)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 객관식(순위선택) 옵션 + 최대 순위 설정 */}
                  {question.type === "객관식(순위선택)" && (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-700">
                            순위 선택 항목
                          </label>
                          <button
                            onClick={() => addOption(index)}
                            className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
                            type="button"
                          >
                            + 선택지 추가
                          </button>
                        </div>
                        {(question.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optIndex, e.target.value)}
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                              placeholder={`순위 선택지 ${optIndex + 1}`}
                            />
                            <button
                              onClick={() => removeOption(index, optIndex)}
                              className="text-red-500 hover:text-red-700"
                              type="button"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-slate-700">
                          최대 순위 선택 수
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, question.options?.length || 1)}
                          value={
                            question.maxRank && question.maxRank > 0
                              ? question.maxRank
                              : Math.min(3, Math.max(1, question.options?.length || 1))
                          }
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            const max = Math.max(1, question.options?.length || 1);
                            const clamped = Number.isNaN(raw)
                              ? 1
                              : Math.min(Math.max(1, raw), max);
                            updateQuestion(index, { maxRank: clamped });
                          }}
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none text-center"
                        />
                        <span className="text-sm text-slate-600">개</span>
                      </div>
                    </div>
                  )}

                  {/* 복수형 주관식: 한 질문 안에 여러 개의 주관식 줄 */}
                  {question.type === "복수형 주관식" && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">
                          주관식 항목 (한 질문 안에 여러 줄의 주관식 문항을 넣을 수 있습니다)
                        </label>
                        <button
                          onClick={() => addOption(index)}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                          type="button"
                        >
                          + 줄 추가
                        </button>
                      </div>
                      {(question.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, optIndex, e.target.value)}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                            placeholder={`주관식 항목 제목 ${optIndex + 1}`}
                          />
                          <button
                            onClick={() => removeOption(index, optIndex)}
                            className="text-red-500 hover:text-red-700"
                            type="button"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 조건부 로직 설정 */}
                  {selectedQuestionIndex === index && question.options && (
                    <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <p className="text-sm font-medium text-purple-900 mb-2">조건부 분기 설정</p>
                      {question.options.map((option) => (
                        <div key={option} className="mb-2 flex items-center gap-2">
                          <span className="text-sm text-purple-700">{option} 선택 시:</span>
                          <select
                            value={question.conditionalLogic?.[option] || ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                setConditionalTarget(index, option, e.target.value);
                              }
                            }}
                            className="rounded border border-purple-300 px-2 py-1 text-sm"
                          >
                            <option value="">질문 선택</option>
                            {questions
                              .filter((q, i) => i > index)
                              .map((q, i) => (
                                <option key={q.id} value={q.id}>
                                  {index + i + 2}번 질문
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}
                      <button
                        onClick={() => setSelectedQuestionIndex(null)}
                        className="mt-2 text-xs text-purple-600 hover:text-purple-700"
                        type="button"
                      >
                        닫기
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

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

            {/* 저장 버튼 */}
            <div className="flex justify-end gap-4">
              <Link
                href="/my-surveys"
                className="rounded-lg bg-slate-200 px-6 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
              >
                취소
              </Link>
              <button
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                {isLoading ? "저장 중..." : editSurveyId ? "수정 완료" : "설문 생성"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 문항 타입 선택 모달 */}
      {showQuestionTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">문항 타입 선택</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">객관식</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addQuestion("객관식(단일)")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    객관식(단일)
                  </button>
                  <button
                    onClick={() => addQuestion("객관식(다중선택)")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    객관식(다중선택)
                  </button>
                  <button
                    onClick={() => addQuestion("객관식(드롭다운)")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    객관식(드롭다운)
                  </button>
                  <button
                    onClick={() => addQuestion("객관식(순위선택)")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    객관식(순위선택)
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">주관식</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addQuestion("단답형")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    단답형
                  </button>
                  <button
                    onClick={() => addQuestion("서술형")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    서술형
                  </button>
                  <button
                    onClick={() => addQuestion("복수형 주관식")}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    복수형 주관식
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowQuestionTypeModal(false)}
              className="mt-4 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300"
              type="button"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 템플릿 선택 모달 */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">템플릿 선택</h3>
            {questionTemplates.length === 0 ? (
              <p className="text-slate-500 text-sm">저장된 템플릿이 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {questionTemplates.map((template, idx) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(idx)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-slate-500">
                      {template.options.join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setShowTemplateModal(false);
                setSelectedTemplateIndex(null);
              }}
              className="mt-4 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300"
              type="button"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateSurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">로딩 중...</p>
      </div>
    }>
      <CreateSurveyPageContent />
    </Suspense>
  );
}
