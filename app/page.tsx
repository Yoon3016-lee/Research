"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Role = "직원" | "관리자" | "마스터";
type QuestionType = "객관식" | "주관식";

type Question = {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  sortOrder?: number;
};

type SurveyResponse = {
  id: string;
  employee: string;
  answers: Record<string, string>;
  submittedAt: string;
};

type Survey = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  questions: Question[];
  responses: SurveyResponse[];
};

type User = {
  id: string;
  password: string;
  role: Role;
};

type QuestionDraft = {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
};

// 초기 시드 데이터는 이제 Supabase에서 관리됩니다

const roleOptions: Role[] = ["직원", "관리자", "마스터"];

const defaultQuestionDraft = (): QuestionDraft => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: "객관식",
  options: ["", ""],
});

export default function Home() {

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("직원");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [signUpId, setSignUpId] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<Role>("직원");
  const [signUpVerificationCode, setSignUpVerificationCode] = useState("");
  const [signUpMessage, setSignUpMessage] = useState("");

  // 확인 코드 관리 (마스터용)
  const [verificationCodes, setVerificationCodes] = useState<
    Array<{ role: "관리자" | "마스터"; code: string; updated_at: string }>
  >([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [codeUpdateRole, setCodeUpdateRole] = useState<"관리자" | "마스터" | null>(null);
  const [newCodeValue, setNewCodeValue] = useState("");
  const [codeUpdateMessage, setCodeUpdateMessage] = useState("");

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [employeeSurveyId, setEmployeeSurveyId] = useState<string>("");
  const [adminSurveyId, setAdminSurveyId] = useState<string>("");
  const [employeeAnswers, setEmployeeAnswers] = useState<Record<string, string>>(
    {},
  );

  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [newQuestions, setNewQuestions] = useState<QuestionDraft[]>([
    defaultQuestionDraft(),
  ]);
  const [newSurveyFeedback, setNewSurveyFeedback] = useState("");
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(false);
  const [surveysError, setSurveysError] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [isDeletingSurvey, setIsDeletingSurvey] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("");

  useEffect(() => {
    const targetSurvey = surveys.find(
      (survey) => survey.id === employeeSurveyId,
    );
    if (!targetSurvey) {
      setEmployeeAnswers({});
      return;
    }
    const defaults: Record<string, string> = {};
    targetSurvey.questions.forEach((question) => {
      defaults[question.id] =
        question.type === "객관식" ? question.options[0] ?? "" : "";
    });
    setEmployeeAnswers(defaults);
  }, [employeeSurveyId, surveys]);

  useEffect(() => {
    if (!employeeSurveyId && surveys.length > 0) {
      setEmployeeSurveyId(surveys[0].id);
    }
    if (!adminSurveyId && surveys.length > 0) {
      setAdminSurveyId(surveys[0].id);
    }
  }, [surveys, employeeSurveyId, adminSurveyId]);

  const fetchSurveys = useCallback(async () => {
    try {
      setIsLoadingSurveys(true);
      setSurveysError("");
      const response = await fetch("/api/surveys");
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "설문을 불러오지 못했습니다.");
      }
      const { data } = (await response.json()) as { data: Survey[] };
      if (Array.isArray(data)) {
        setSurveys(data);
        const employeeValid = data.some(
          (survey) => survey.id === employeeSurveyId,
        );
        const adminValid = data.some(
          (survey) => survey.id === adminSurveyId,
        );
        if (!employeeValid) {
          setEmployeeSurveyId(data[0]?.id ?? "");
        }
        if (!adminValid) {
          setAdminSurveyId(data[0]?.id ?? "");
        }
      }
    } catch (error) {
      setSurveysError((error as Error).message);
    } finally {
      setIsLoadingSurveys(false);
    }
  }, [employeeSurveyId, adminSurveyId]);

  useEffect(() => {
    void fetchSurveys();
  }, [fetchSurveys]);

  const completedCount = useMemo(
    () => surveys.reduce((sum, survey) => sum + survey.responses.length, 0),
    [surveys],
  );

  const currentEmployeeSurvey = surveys.find(
    (survey) => survey.id === employeeSurveyId,
  );
  const currentAdminSurvey = surveys.find(
    (survey) => survey.id === adminSurveyId,
  );

  const employeeCounts = useMemo(() => {
    if (!currentAdminSurvey) {
      return [];
    }
    const countMap = currentAdminSurvey.responses.reduce<Record<string, number>>(
      (acc, response) => {
        acc[response.employee] = (acc[response.employee] ?? 0) + 1;
        return acc;
      },
      {},
    );
    return Object.entries(countMap).map(([employee, count]) => ({
      employee,
      count,
    }));
  }, [currentAdminSurvey]);

  const questionStatistics = useMemo(() => {
    if (!currentAdminSurvey) {
      return {} as Record<string, Record<string, number>>;
    }
    const stats: Record<string, Record<string, number>> = {};
    currentAdminSurvey.questions.forEach((question) => {
      if (question.type === "객관식") {
        stats[question.id] = question.options.reduce<Record<string, number>>(
          (acc, option) => {
            acc[option] = 0;
            return acc;
          },
          {},
        );
      }
    });
    currentAdminSurvey.responses.forEach((response) => {
      Object.entries(response.answers).forEach(([questionId, answer]) => {
        if (!stats[questionId]) {
          stats[questionId] = {};
        }
        stats[questionId][answer] = (stats[questionId][answer] ?? 0) + 1;
      });
    });
    return stats;
  }, [currentAdminSurvey]);

  const canUseEmployeePanel = isLoggedIn && role === "직원";
  const canUseAdminPanel = isLoggedIn && role !== "직원";

  const handleLogin = async () => {
    setLoginError("");
    setLoginMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: loginId.trim(),
          password: password.trim(),
        }),
      });
      const result = (await response.json()) as {
        data?: { id: string; role: Role };
        error?: string;
      };
      if (!response.ok || !result.data) {
        setLoginError(result.error ?? "로그인에 실패했습니다.");
        setIsLoggedIn(false);
        setActiveUser(null);
        return;
      }
      const user: User = {
        id: result.data.id,
        password: password.trim(),
        role: result.data.role,
      };
      setActiveUser(user);
      setIsLoggedIn(true);
      setRole(result.data.role);
      setLoginMessage(`${result.data.role} 권한으로 접속되었습니다.`);
    } catch (error) {
      setLoginError((error as Error).message);
      setIsLoggedIn(false);
      setActiveUser(null);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveUser(null);
    setLoginMessage("");
    setLoginError("");
    setLoginId("");
    setPassword("");
    setSelectedEmployeeFilter("");
  };

  const handleSignUp = async () => {
    setSignUpMessage("");
    if (!signUpId.trim() || !signUpPassword.trim()) {
      setSignUpMessage("ID와 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 관리자 또는 마스터 회원가입 시 확인 코드 검증
    if ((signUpRole === "관리자" || signUpRole === "마스터") && !signUpVerificationCode.trim()) {
      setSignUpMessage(`${signUpRole} 회원가입을 위해서는 확인 코드가 필요합니다.`);
      return;
    }

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
          verificationCode:
            signUpRole === "관리자" || signUpRole === "마스터"
              ? signUpVerificationCode.trim()
              : undefined,
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setSignUpMessage(result.error ?? "회원가입에 실패했습니다.");
        return;
      }
      setSignUpMessage(result.message ?? "회원가입이 완료되었습니다. 로그인해주세요.");
      setSignUpId("");
      setSignUpPassword("");
      setSignUpVerificationCode("");
    } catch (error) {
      setSignUpMessage((error as Error).message);
    }
  };

  // 확인 코드 조회
  const fetchVerificationCodes = useCallback(async () => {
    if (role !== "마스터" || !isLoggedIn) {
      return;
    }
    try {
      setIsLoadingCodes(true);
      const response = await fetch("/api/verification-codes");
      if (!response.ok) {
        throw new Error("확인 코드를 불러오지 못했습니다.");
      }
      const { data } = (await response.json()) as {
        data: Array<{ role: "관리자" | "마스터"; code: string; updated_at: string }>;
      };
      setVerificationCodes(data);
    } catch (error) {
      setCodeUpdateMessage((error as Error).message);
    } finally {
      setIsLoadingCodes(false);
    }
  }, [role, isLoggedIn]);

  useEffect(() => {
    if (role === "마스터" && isLoggedIn) {
      void fetchVerificationCodes();
    }
  }, [role, isLoggedIn, fetchVerificationCodes]);

  // 확인 코드 업데이트
  const handleUpdateVerificationCode = async () => {
    if (!codeUpdateRole || !newCodeValue.trim() || !activeUser) {
      setCodeUpdateMessage("역할과 새 확인 코드를 입력해주세요.");
      return;
    }

    try {
      setCodeUpdateMessage("");
      const response = await fetch("/api/verification-codes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: codeUpdateRole,
          code: newCodeValue.trim(),
          masterId: activeUser.id,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setCodeUpdateMessage(result.error ?? "확인 코드 변경에 실패했습니다.");
        return;
      }

      setCodeUpdateMessage(result.message ?? "확인 코드가 성공적으로 변경되었습니다.");
      setNewCodeValue("");
      setCodeUpdateRole(null);
      await fetchVerificationCodes();
    } catch (error) {
      setCodeUpdateMessage((error as Error).message);
    }
  };

  const handleEmployeeAnswer = (questionId: string, value: string) => {
    setEmployeeAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleEmployeeSubmit = async () => {
    if (!isLoggedIn || role !== "직원") {
      setLoginError("직원 계정으로 접속 완료 후 설문이 가능합니다.");
      return;
    }
    if (!currentEmployeeSurvey) {
      return;
    }
    const hasEmpty = currentEmployeeSurvey.questions.some((question) => {
      const answer = employeeAnswers[question.id];
      return !answer || !answer.trim();
    });
    if (hasEmpty) {
      setLoginError("모든 문항에 응답해주세요.");
      return;
    }
    try {
      setIsSubmittingResponse(true);
      const normalizedAnswers = Object.entries(employeeAnswers).reduce<
        Record<string, string>
      >((acc, [questionId, answer]) => {
        acc[questionId] = answer.trim();
        return acc;
      }, {});
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyId: currentEmployeeSurvey.id,
          employeeId: activeUser?.id ?? loginId.trim(),
          answers: normalizedAnswers,
        }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "설문 저장에 실패했습니다.");
      }
      setLoginMessage("설문이 저장되었습니다.");
      await fetchSurveys();
    } catch (error) {
      setLoginError((error as Error).message);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleAddQuestion = () => {
    setNewQuestions((prev) => [...prev, defaultQuestionDraft()]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setNewQuestions((prev) =>
      prev.length <= 1 ? prev : prev.filter((question) => question.id !== questionId),
    );
  };

  const handleQuestionPromptChange = (questionId: string, value: string) => {
    setNewQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, prompt: value } : question,
      ),
    );
  };

  const handleQuestionTypeChange = (questionId: string, nextType: QuestionType) => {
    setNewQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              type: nextType,
              options:
                nextType === "객관식"
                  ? question.options.length >= 2
                    ? question.options
                    : ["", ""]
                  : [],
            }
          : question,
      ),
    );
  };

  const handleQuestionOptionChange = (
    questionId: string,
    index: number,
    value: string,
  ) => {
    setNewQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, i) =>
                i === index ? value : option,
              ),
            }
          : question,
      ),
    );
  };

  const handleAddOption = (questionId: string) => {
    setNewQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, ""] }
          : question,
      ),
    );
  };

  const handleRemoveOption = (questionId: string, index: number) => {
    setNewQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) {
          return question;
        }
        if (question.options.length <= 2) {
          return question;
        }
        return {
          ...question,
          options: question.options.filter((_, i) => i !== index),
        };
      }),
    );
  };

  const resetNewSurveyForm = () => {
    setNewSurveyTitle("");
    setNewQuestions([defaultQuestionDraft()]);
  };

  const handleAddSurvey = async () => {
    setNewSurveyFeedback("");
    if (!newSurveyTitle.trim()) {
      setNewSurveyFeedback("조사표 제목을 입력해주세요.");
      return;
    }
    const preparedQuestions: Question[] = [];
    for (const question of newQuestions) {
      const prompt = question.prompt.trim();
      if (!prompt) {
        setNewSurveyFeedback("모든 문항에 질문 내용을 입력해주세요.");
        return;
      }
      const options =
        question.type === "객관식"
          ? question.options.map((option) => option.trim()).filter(Boolean)
          : [];
      if (question.type === "객관식" && options.length < 2) {
        setNewSurveyFeedback("객관식 문항은 2개 이상의 선택지를 입력해주세요.");
        return;
      }
      preparedQuestions.push({
        id: crypto.randomUUID(),
        prompt,
        type: question.type,
        options,
      });
    }
    try {
      setIsCreatingSurvey(true);
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newSurveyTitle.trim(),
          questions: preparedQuestions.map((question, index) => ({
            prompt: question.prompt,
            type: question.type,
            options: question.type === "객관식" ? question.options : [],
            sortOrder: index,
          })),
        }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "설문 생성에 실패했습니다.");
      }
      setNewSurveyFeedback("새로운 설문이 추가되었습니다.");
      resetNewSurveyForm();
      await fetchSurveys();
    } catch (error) {
      setNewSurveyFeedback((error as Error).message);
    } finally {
      setIsCreatingSurvey(false);
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm("정말로 이 설문을 삭제하시겠습니까? 삭제된 설문과 모든 응답은 복구할 수 없습니다.")) {
      return;
    }

    try {
      setIsDeletingSurvey(true);
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "설문 삭제에 실패했습니다.");
      }

      setLoginMessage("설문이 삭제되었습니다.");
      await fetchSurveys();
      
      // 삭제된 설문이 선택되어 있었다면 첫 번째 설문으로 변경
      if (adminSurveyId === surveyId) {
        const remainingSurveys = surveys.filter((s) => s.id !== surveyId);
        if (remainingSurveys.length > 0) {
          setAdminSurveyId(remainingSurveys[0].id);
        } else {
          setAdminSurveyId("");
        }
      }
    } catch (error) {
      setLoginError((error as Error).message);
    } finally {
      setIsDeletingSurvey(false);
    }
  };

  const adminSurveyChoices = (
    <div className="flex flex-wrap gap-2">
      {surveys.map((survey) => (
        <div
          key={survey.id}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            adminSurveyId === survey.id
              ? "border-cyan-400 bg-cyan-400/20 text-cyan-100"
              : "border-white/10 text-slate-200 hover:border-cyan-300/60"
          }`}
        >
          <button
            type="button"
            onClick={() => setAdminSurveyId(survey.id)}
            className="flex-1 text-left"
          >
            {survey.title}
          </button>
          {role === "마스터" && (
            <button
              type="button"
              onClick={() => handleDeleteSurvey(survey.id)}
              disabled={isDeletingSurvey}
              className="ml-2 rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
              title="설문 삭제"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-400">
              리서치 설문조사
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white">
              리서치 홈페이지 허브
            </h1>
            <p className="text-sm text-slate-300">
              Vercel Edge 배포와 Supabase 보안을 전제로 한 설문 설계 예시 화면입니다.
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>배포: Vercel</p>
            <p>DB: Supabase</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">로그인</h2>
            <p className="text-sm text-slate-400">
              역할 기반 접근 제어를 위한 기본 로그인 패널
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300">ID</label>
                <input
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="사번 또는 이메일"
                  disabled={isLoggedIn}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호"
                  disabled={isLoggedIn}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                />
              </div>
              <button
                onClick={isLoggedIn ? handleLogout : () => void handleLogin()}
                className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                type="button"
              >
                {isLoggedIn ? "로그아웃" : "접속 요청"}
              </button>
              {loginError && (
                <p className="text-xs text-red-400">{loginError}</p>
              )}
              {loginMessage && !loginError && (
                <p className="text-xs text-emerald-400">{loginMessage}</p>
              )}
            </div>
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-white">회원가입</h3>
              <div className="mt-4 space-y-4">
                <input
                  value={signUpId}
                  onChange={(event) => setSignUpId(event.target.value)}
                  placeholder="새 ID"
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(event) => setSignUpPassword(event.target.value)}
                  placeholder="새 비밀번호"
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <select
                  value={signUpRole}
                  onChange={(event) => {
                    setSignUpRole(event.target.value as Role);
                    setSignUpVerificationCode("");
                  }}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option} className="text-black">
                      {option}
                    </option>
                  ))}
                </select>
                {(signUpRole === "관리자" || signUpRole === "마스터") && (
                  <div>
                    <label className="text-xs text-slate-300">
                      {signUpRole} 확인 코드
                    </label>
                    <input
                      type="text"
                      value={signUpVerificationCode}
                      onChange={(event) =>
                        setSignUpVerificationCode(event.target.value)
                      }
                      placeholder={`${signUpRole} 확인 코드 입력`}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      {signUpRole} 회원가입을 위해서는 확인 코드가 필요합니다.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => void handleSignUp()}
                  className="w-full rounded-lg border border-cyan-400/60 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
                  type="button"
                >
                  회원가입 완료
                </button>
                {signUpMessage && (
                  <p
                    className={`text-xs ${
                      signUpMessage.includes("완료") || signUpMessage.includes("성공")
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {signUpMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!isLoggedIn && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center text-slate-400">
                ID와 Password를 입력 후{" "}
                <span className="text-cyan-300">접속 요청</span>을 눌러 로그인하세요.
                계급은 자동으로 적용됩니다.
              </div>
            )}

            {surveysError && (
              <div className="rounded-2xl border border-red-400/40 bg-red-950/30 p-4 text-sm text-red-100">
                Supabase 동기화 오류: {surveysError}
              </div>
            )}

            {isLoadingSurveys && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
                Supabase에서 최신 설문 데이터를 불러오는 중입니다...
              </div>
            )}

            {canUseEmployeePanel && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-white">
                    직원 설문진행
                  </h2>
                  <select
                    value={employeeSurveyId}
                    onChange={(event) =>
                      setEmployeeSurveyId(event.target.value)
                    }
                    className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {surveys.map((survey) => (
                      <option key={survey.id} value={survey.id} className="text-black">
                        {survey.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-300">선택된 설문</p>
                    <p className="text-lg font-medium text-white">
                      {currentEmployeeSurvey?.title ?? "설문을 선택해주세요"}
                    </p>
                  </div>

                  {currentEmployeeSurvey &&
                    currentEmployeeSurvey.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <p className="text-sm text-slate-300">
                          문항 {index + 1}
                        </p>
                        <p className="text-base font-medium text-white">
                          {question.prompt}
                        </p>
                        {question.type === "객관식" ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {question.options.map((option) => (
                              <button
                                key={option}
                                onClick={() =>
                                  handleEmployeeAnswer(question.id, option)
                                }
                                type="button"
                                className={`rounded-full px-4 py-2 text-sm transition ${
                                  employeeAnswers[question.id] === option
                                    ? "bg-cyan-500 text-slate-950"
                                    : "bg-slate-800 text-white hover:bg-slate-700"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            value={employeeAnswers[question.id] ?? ""}
                            onChange={(event) =>
                              handleEmployeeAnswer(question.id, event.target.value)
                            }
                            placeholder="자유롭게 입력하세요."
                            className="mt-3 h-28 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                          />
                        )}
                      </div>
                    ))}

                  {currentEmployeeSurvey && (
                    <button
                      onClick={handleEmployeeSubmit}
                      disabled={isSubmittingResponse}
                      className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                    >
                      {isSubmittingResponse ? "저장 중..." : "설문 시작 및 저장"}
                    </button>
                  )}
                </div>
              </section>
            )}

            {canUseAdminPanel && (
              <section className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-white">
                    {role} 설문 관리
                  </h2>
                  <p className="text-xs text-slate-400">
                    조사표를 선택하면 직원 응답을 바로 확인할 수 있습니다.
                  </p>
                </div>

                <div className="mt-4">{adminSurveyChoices}</div>

                <div className="mt-6 space-y-6">
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-semibold text-white">사원별 입력 수</p>
                    <ul className="mt-3 space-y-2">
                      {employeeCounts.length === 0 && (
                        <li className="text-sm text-slate-400">아직 응답이 없습니다.</li>
                      )}
                      {employeeCounts.map((item) => (
                        <li
                          key={item.employee}
                          className="flex items-center justify-between rounded-md border border-white/5 px-3 py-1.5 text-sm"
                        >
                          <span>{item.employee}</span>
                          <span className="font-semibold text-cyan-400">
                            {item.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-sm font-semibold text-white">문항별 통계</p>
                      {currentAdminSurvey?.questions.map((question) => (
                        <div key={question.id} className="mt-4">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {question.type}
                          </p>
                          <p className="text-sm font-medium text-white">
                            {question.prompt}
                          </p>
                          {question.type === "객관식" ? (
                            <ul className="mt-2 space-y-1 text-sm">
                              {question.options.map((option) => (
                                <li
                                  key={option}
                                  className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-1.5"
                                >
                                  <span>{option}</span>
                                  <span className="text-cyan-400">
                                    {questionStatistics[question.id]?.[option] ?? 0}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs text-slate-400">
                              주관식 문항은 아래 응답 상세에서 확인하세요.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">응답 상세</p>
                        <select
                          value={selectedEmployeeFilter}
                          onChange={(event) => setSelectedEmployeeFilter(event.target.value)}
                          className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="" className="text-black">
                            전체 직원
                          </option>
                          {employeeCounts.map((item) => (
                            <option key={item.employee} value={item.employee} className="text-black">
                              {item.employee} ({item.count}건)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                        {(() => {
                          const filteredResponses = selectedEmployeeFilter
                            ? currentAdminSurvey?.responses.filter(
                                (response) => response.employee === selectedEmployeeFilter,
                              ) ?? []
                            : currentAdminSurvey?.responses ?? [];

                          if (filteredResponses.length === 0) {
                            return (
                              <p className="text-sm text-slate-400">
                                {selectedEmployeeFilter
                                  ? "선택한 직원의 응답이 없습니다."
                                  : "데이터가 없습니다."}
                              </p>
                            );
                          }

                          return filteredResponses.map((response) => (
                            <div
                              key={response.id}
                              className="rounded-lg border border-white/5 px-3 py-3 text-sm"
                            >
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>{response.employee}</span>
                                <span>
                                  {new Date(response.submittedAt).toLocaleString("ko-KR")}
                                </span>
                              </div>
                              <ul className="mt-2 space-y-1 text-slate-200">
                                {currentAdminSurvey?.questions.map((question) => (
                                  <li key={question.id}>
                                    <span className="text-xs text-slate-400">
                                      {question.prompt}
                                    </span>
                                    <p className="text-sm">
                                      {response.answers[question.id] ?? "-"}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-cyan-400/40 bg-slate-950/40 p-4">
                    <p className="text-sm font-semibold text-white">설문조사 추가</p>
                    <div className="mt-4">
                      <label className="text-xs text-slate-400">조사표 제목</label>
                      <input
                        value={newSurveyTitle}
                        onChange={(event) => setNewSurveyTitle(event.target.value)}
                        placeholder="예: 신규 복지 아이디어"
                        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div className="mt-6 space-y-5">
                      {newQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="rounded-lg border border-white/10 bg-slate-950/50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">
                              문항 {index + 1}
                            </p>
                            <button
                              onClick={() => handleRemoveQuestion(question.id)}
                              type="button"
                              className="text-xs text-red-300 hover:text-red-200"
                              disabled={newQuestions.length <= 1}
                            >
                              삭제
                            </button>
                          </div>
                          <textarea
                            value={question.prompt}
                            onChange={(event) =>
                              handleQuestionPromptChange(question.id, event.target.value)
                            }
                            placeholder="질문 내용을 입력하세요."
                            className="mt-3 h-24 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                          />
                          <div className="mt-3">
                            <label className="text-xs text-slate-400">질문 유형</label>
                            <select
                              value={question.type}
                              onChange={(event) =>
                                handleQuestionTypeChange(
                                  question.id,
                                  event.target.value as QuestionType,
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                            >
                              <option value="객관식" className="text-black">
                                객관식
                              </option>
                              <option value="주관식" className="text-black">
                                주관식
                              </option>
                            </select>
                          </div>
                          {question.type === "객관식" && (
                            <div className="mt-3 space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2">
                                  <input
                                    value={option}
                                    onChange={(event) =>
                                      handleQuestionOptionChange(
                                        question.id,
                                        optionIndex,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={`선택지 ${optionIndex + 1}`}
                                    className="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                                  />
                                  <button
                                    onClick={() =>
                                      handleRemoveOption(question.id, optionIndex)
                                    }
                                    type="button"
                                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-red-400 hover:text-red-400"
                                    disabled={question.options.length <= 2}
                                  >
                                    삭제
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => handleAddOption(question.id)}
                                type="button"
                                className="w-full rounded-lg border border-cyan-400/60 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/10"
                              >
                                선택지 추가
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddQuestion}
                        type="button"
                        className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-400 hover:text-cyan-200"
                      >
                        문항 추가
                      </button>
                    </div>

                    {newSurveyFeedback && (
                      <p className="mt-4 text-xs text-cyan-300">{newSurveyFeedback}</p>
                    )}

                    <button
                      onClick={handleAddSurvey}
                      disabled={isCreatingSurvey}
                      className="mt-6 w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                    >
                      {isCreatingSurvey ? "생성 중..." : "설문 생성"}
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 shadow-lg">
                  <p className="text-xs text-slate-400">완료된 조사표</p>
                  <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
                </div>
              </section>
            )}

            {role === "마스터" && isLoggedIn && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-white">확인 코드 관리</h2>
                <p className="mt-2 text-sm text-slate-400">
                  관리자 및 마스터 회원가입에 사용되는 확인 코드를 관리합니다.
                </p>

                <div className="mt-6 space-y-4">
                  {isLoadingCodes ? (
                    <p className="text-sm text-slate-400">확인 코드를 불러오는 중...</p>
                  ) : (
                    <>
                      {verificationCodes.map((codeData) => (
                        <div
                          key={codeData.role}
                          className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {codeData.role} 확인 코드
                              </p>
                              <p className="mt-1 text-lg font-mono text-cyan-400">
                                {codeData.code}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                마지막 변경:{" "}
                                {new Date(codeData.updated_at).toLocaleString("ko-KR")}
          </p>
        </div>
                            <button
                              onClick={() => {
                                setCodeUpdateRole(codeData.role);
                                setNewCodeValue("");
                                setCodeUpdateMessage("");
                              }}
                              type="button"
                              className="rounded-lg border border-cyan-400/60 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/10"
                            >
                              변경
                            </button>
                          </div>

                          {codeUpdateRole === codeData.role && (
                            <div className="mt-4 space-y-2 rounded-lg border border-cyan-400/30 bg-slate-900/60 p-3">
                              <label className="text-xs text-slate-300">
                                새 확인 코드 입력
                              </label>
                              <input
                                type="text"
                                value={newCodeValue}
                                onChange={(event) =>
                                  setNewCodeValue(event.target.value)
                                }
                                placeholder="새 확인 코드"
                                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => void handleUpdateVerificationCode()}
                                  type="button"
                                  className="flex-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => {
                                    setCodeUpdateRole(null);
                                    setNewCodeValue("");
                                    setCodeUpdateMessage("");
                                  }}
                                  type="button"
                                  className="flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {codeUpdateMessage && (
                    <p
                      className={`text-xs ${
                        codeUpdateMessage.includes("성공") ||
                        codeUpdateMessage.includes("완료")
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {codeUpdateMessage}
                    </p>
                  )}
                </div>
              </section>
            )}
        </div>
        </section>
      </main>
    </div>
  );
}

