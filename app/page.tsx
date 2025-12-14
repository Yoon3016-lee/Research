"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Role = "직원" | "관리자" | "마스터";
type QuestionType = 
  | "객관식(단일)" 
  | "객관식(다중선택)" 
  | "객관식(드롭다운)" 
  | "객관식(순위선택)"
  | "단답형" 
  | "서술형";

// 호환성을 위한 헬퍼 함수
const isObjectiveType = (type: QuestionType): boolean => {
  return type.startsWith("객관식");
};

type ConditionalLogic = {
  [option: string]: string; // option -> targetQuestionId
};

type Question = {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  sortOrder?: number;
  conditionalLogic?: ConditionalLogic; // 선택한 옵션에 따른 다음 질문 ID 매핑
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
  conditionalLogic?: ConditionalLogic; // 선택한 옵션에 따른 다음 질문 ID 매핑
};

// 초기 시드 데이터는 이제 Supabase에서 관리됩니다

const roleOptions: Role[] = ["직원", "관리자", "마스터"];
const defaultChoiceOptions = [
  "매우 불만족",
  "불만족",
  "약간 불만족",
  "약간 만족",
  "만족",
  "매우 만족",
];

const defaultQuestionDraft = (type?: QuestionType): QuestionDraft => ({
  id: crypto.randomUUID(),
  prompt: "",
  type: type ?? "객관식(단일)",
  options: type?.startsWith("객관식") ? [...defaultChoiceOptions] : [],
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
    Array<{ role: "직원" | "관리자" | "마스터"; code: string; updated_at: string }>
  >([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [codeUpdateRole, setCodeUpdateRole] = useState<"직원" | "관리자" | "마스터" | null>(
    null,
  );
  const [newCodeValue, setNewCodeValue] = useState("");
  const [codeUpdateMessage, setCodeUpdateMessage] = useState("");

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [employeeSurveyId, setEmployeeSurveyId] = useState<string>("");
  const [adminSurveyId, setAdminSurveyId] = useState<string>("");
  const [employeeAnswers, setEmployeeAnswers] = useState<Record<string, string | string[]>>(
    {},
  );

  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [newQuestions, setNewQuestions] = useState<QuestionDraft[]>([
    defaultQuestionDraft("객관식(단일)"),
  ]);
  const [newSurveyFeedback, setNewSurveyFeedback] = useState("");
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(false);
  const [surveysError, setSurveysError] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [isUpdatingSurvey, setIsUpdatingSurvey] = useState(false);
  const [isDeletingSurvey, setIsDeletingSurvey] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>("");
  const [showCreateSurvey, setShowCreateSurvey] = useState(false);
  const [showFunctionsDropdown, setShowFunctionsDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelectingSurveyForEdit, setIsSelectingSurveyForEdit] = useState(false);
  const [showVerificationCodeManagement, setShowVerificationCodeManagement] = useState(false);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [showQuickQuestionTemplates, setShowQuickQuestionTemplates] = useState(false);
  const [showDeploymentManagement, setShowDeploymentManagement] = useState(false);
  
  // 배포 관리 관련 상태
  const [selectedSurveyForDeployment, setSelectedSurveyForDeployment] = useState("");
  const [recipients, setRecipients] = useState<Array<{
    id: string;
    name: string;
    email: string;
    email_sent: boolean;
    email_sent_at: string | null;
  }>>([]);
  const [isUploadingRecipients, setIsUploadingRecipients] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [deploymentMessage, setDeploymentMessage] = useState("");
  
  // 빠른 문항 템플릿 관련 상태
  const [questionTemplates, setQuestionTemplates] = useState<
    Array<{
      id: string;
      name: string;
      question_type: "객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)";
      options: string[];
      created_at: string;
    }>
  >([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateType, setNewTemplateType] = useState<"객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)">("객관식(단일)");
  const [newTemplateOptions, setNewTemplateOptions] = useState<string[]>([...defaultChoiceOptions]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  useEffect(() => {
    const targetSurvey = surveys.find(
      (survey) => survey.id === employeeSurveyId,
    );
    if (!targetSurvey) {
      setEmployeeAnswers({});
      return;
    }
    const defaults: Record<string, string | string[]> = {};
    targetSurvey.questions.forEach((question) => {
      if (isObjectiveType(question.type)) {
        if (question.type === "객관식(다중선택)") {
          defaults[question.id] = [];
        } else {
          defaults[question.id] = question.options[0] ?? "";
        }
      } else {
        defaults[question.id] = "";
      }
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

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!showFunctionsDropdown) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.functions-dropdown-container')) {
        setShowFunctionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFunctionsDropdown]);

  const currentEmployeeSurvey = surveys.find(
    (survey) => survey.id === employeeSurveyId,
  );
  const currentAdminSurvey = surveys.find(
    (survey) => survey.id === adminSurveyId,
  );

  // 조건부 로직에 따라 표시할 질문 필터링 (모든 질문의 조건부 로직 고려)
  const visibleEmployeeQuestions = useMemo(() => {
    if (!currentEmployeeSurvey) return [];
    
    const questions = currentEmployeeSurvey.questions;
    if (questions.length === 0) return [];
    
    const visible: Question[] = [];
    
    // 현재 질문 인덱스를 추적하며 다음 질문 결정
    let currentIndex = 0;
    const processed = new Set<string>(); // 순환 참조 방지
    
    while (currentIndex < questions.length) {
      const currentQuestion = questions[currentIndex];
      
      // 이미 처리된 질문이면 중단 (순환 참조 방지)
      if (processed.has(currentQuestion.id)) {
        break;
      }
      processed.add(currentQuestion.id);
      
      // 현재 질문 추가
      if (!visible.find(q => q.id === currentQuestion.id)) {
        visible.push(currentQuestion);
      }
      
      // 조건부 로직이 있는 객관식 질문만 답변 필요, 주관식은 답변 없이도 다음 질문으로 진행
      const answer = employeeAnswers[currentQuestion.id];
      const hasAnswer = answer && (
        Array.isArray(answer) 
          ? answer.length > 0 && answer.some(item => item && item.trim())
          : (answer as string).trim() !== ""
      );
      
      // 조건부 로직이 있는 객관식 질문은 답변이 있어야 다음 질문으로 진행
      if (currentQuestion.conditionalLogic && isObjectiveType(currentQuestion.type)) {
        if (!hasAnswer) {
          break; // 답변이 없으면 중단
        }
      }
      
      // 조건부 로직 확인
      let nextIndex = currentIndex + 1; // 기본값: 다음 질문
      
      if (currentQuestion.conditionalLogic && hasAnswer) {
        const answerString = Array.isArray(answer) 
          ? answer[0] ?? "" 
          : (answer as string);
        const targetQuestionId = currentQuestion.conditionalLogic[answerString];
        if (targetQuestionId) {
          // 타겟 질문의 인덱스 찾기
          const targetIndex = questions.findIndex(q => q.id === targetQuestionId);
          if (targetIndex >= 0) {
            nextIndex = targetIndex;
          }
        }
      }
      
      // 다음 질문으로 이동
      if (nextIndex < questions.length) {
        currentIndex = nextIndex;
      } else {
        break; // 더 이상 질문이 없음
      }
    }
    
    return visible;
  }, [currentEmployeeSurvey, employeeAnswers]);

  const completedCount = useMemo(
    () => currentAdminSurvey?.responses.length ?? 0,
    [currentAdminSurvey],
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
      if (isObjectiveType(question.type)) {
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

    if (!signUpVerificationCode.trim()) {
      setSignUpMessage("확인 코드를 입력해주세요.");
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
          verificationCode: signUpVerificationCode.trim(),
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

  // 빠른 문항 템플릿 관련 함수
  const fetchQuestionTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/question-templates");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "템플릿을 불러오는데 실패했습니다.";
        console.error("Failed to fetch question templates:", errorMessage);
        throw new Error(errorMessage);
      }
      const { data } = (await response.json()) as {
        data: Array<{
          id: string;
          name: string;
          question_type: "객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)";
          options: string[];
          created_at: string;
        }>;
      };
      setQuestionTemplates(data || []);
    } catch (error) {
      console.error("Failed to fetch question templates:", error);
      // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setQuestionTemplates([]);
    }
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      setNewSurveyFeedback("템플릿 이름을 입력해주세요.");
      return;
    }
    if (newTemplateOptions.length === 0 || newTemplateOptions.some(opt => !opt.trim())) {
      setNewSurveyFeedback("옵션을 모두 입력해주세요.");
      return;
    }
    try {
      setIsCreatingTemplate(true);
      const response = await fetch("/api/question-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          question_type: newTemplateType,
          options: newTemplateOptions.filter(opt => opt.trim()),
        }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "템플릿 생성에 실패했습니다.");
      }
      setNewSurveyFeedback("템플릿이 생성되었습니다.");
      setNewTemplateName("");
      setNewTemplateOptions([...defaultChoiceOptions]);
      await fetchQuestionTemplates();
    } catch (error) {
      setNewSurveyFeedback((error as Error).message);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      return;
    }
    try {
      const response = await fetch(`/api/question-templates?id=${templateId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "템플릿 삭제에 실패했습니다.");
      }
      await fetchQuestionTemplates();
    } catch (error) {
      setNewSurveyFeedback((error as Error).message);
    }
  };

  // 배포 관리 관련 함수
  const fetchRecipients = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/recipients?surveyId=${surveyId}`);
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "수신자 목록을 불러오는데 실패했습니다.");
      }
      const { data } = (await response.json()) as {
        data: Array<{
          id: string;
          name: string;
          email: string;
          email_sent: boolean;
          email_sent_at: string | null;
        }>;
      };
      setRecipients(data || []);
    } catch (error) {
      console.error("Failed to fetch recipients:", error);
      setDeploymentMessage((error as Error).message);
    }
  };

  const handleUploadRecipients = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSurveyForDeployment) {
      setDeploymentMessage("파일과 설문을 선택해주세요.");
      return;
    }

    try {
      setIsUploadingRecipients(true);
      setDeploymentMessage("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("surveyId", selectedSurveyForDeployment);

      const response = await fetch("/api/recipients", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "수신자 업로드에 실패했습니다.");
      }

      setDeploymentMessage(result.message ?? "수신자가 업로드되었습니다.");
      await fetchRecipients(selectedSurveyForDeployment);
      // 파일 입력 초기화
      event.target.value = "";
    } catch (error) {
      setDeploymentMessage((error as Error).message);
    } finally {
      setIsUploadingRecipients(false);
    }
  };

  const handleSendEmails = async () => {
    if (!selectedSurveyForDeployment) {
      setDeploymentMessage("설문을 선택해주세요.");
      return;
    }

    const targetSurvey = surveys.find((s) => s.id === selectedSurveyForDeployment);
    if (!targetSurvey) {
      setDeploymentMessage("설문을 찾을 수 없습니다.");
      return;
    }

    const unsentRecipients = recipients.filter((r) => !r.email_sent);
    if (unsentRecipients.length === 0) {
      setDeploymentMessage("발송할 수신자가 없습니다.");
      return;
    }

    if (!confirm(`총 ${unsentRecipients.length}명에게 이메일을 발송하시겠습니까?`)) {
      return;
    }

    try {
      setIsSendingEmails(true);
      setDeploymentMessage("");

      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyId: selectedSurveyForDeployment,
          surveyTitle: targetSurvey.title,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error ?? "이메일 발송에 실패했습니다.";
        let fullErrorMsg = errorMsg;
        
        // 도움말 메시지 추가
        if (result.helpMessage) {
          fullErrorMsg += `\n\n${result.helpMessage}`;
        }
        
        // 환경변수 누락 정보
        if (result.missingVariables) {
          fullErrorMsg += `\n\n누락된 환경변수: ${result.missingVariables.join(", ")}`;
        }
        
        // 현재 설정 정보 (디버깅용, 민감 정보는 마스킹)
        if (result.details && process.env.NODE_ENV === "development") {
          const safeDetails = { ...result.details };
          if (safeDetails.user) {
            safeDetails.user = safeDetails.user.replace(/(.{2}).*(@.*)/, "$1***$2");
          }
          fullErrorMsg += `\n\n[개발 모드] 상세 오류:\n${JSON.stringify(safeDetails, null, 2)}`;
        }
        
        throw new Error(fullErrorMsg);
      }

      // 실패한 이메일이 있으면 상세 정보 표시
      let message = result.message ?? "이메일이 발송되었습니다.";
      if (result.failedDetails && result.failedDetails.length > 0) {
        message += "\n\n실패 상세:\n";
        result.failedDetails.forEach((failed: { email: string; error: string; details?: unknown }) => {
          message += `- ${failed.email}: ${failed.error}\n`;
          if (failed.details) {
            message += `  상세: ${JSON.stringify(failed.details, null, 2)}\n`;
          }
        });
      }

      setDeploymentMessage(message);
      await fetchRecipients(selectedSurveyForDeployment);
    } catch (error) {
      setDeploymentMessage((error as Error).message);
    } finally {
      setIsSendingEmails(false);
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
        data: Array<{ role: "직원" | "관리자" | "마스터"; code: string; updated_at: string }>;
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

  const handleEmployeeAnswer = (questionId: string, value: string | string[]) => {
    setEmployeeAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleEmployeeMultipleAnswer = (questionId: string, option: string, checked: boolean) => {
    setEmployeeAnswers((prev) => {
      const current = prev[questionId];
      const currentArray = Array.isArray(current) ? current : [];
      if (checked) {
        return { ...prev, [questionId]: [...currentArray, option] };
      } else {
        return { ...prev, [questionId]: currentArray.filter((item) => item !== option) };
      }
    });
  };

  const handleEmployeeSubmit = async () => {
    if (!isLoggedIn || role !== "직원") {
      setLoginError("직원 계정으로 접속 완료 후 설문이 가능합니다.");
      return;
    }
    if (!currentEmployeeSurvey) {
      return;
    }
    const hasEmpty = visibleEmployeeQuestions.some((question) => {
      const answer = employeeAnswers[question.id];
      if (Array.isArray(answer)) {
        return answer.length === 0 || answer.some((item) => !item || !item.trim());
      }
      return !answer || (typeof answer === "string" && !answer.trim());
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
        if (Array.isArray(answer)) {
          acc[questionId] = answer.filter((item) => item && item.trim()).join("|"); // 배열은 |로 구분하여 저장
        } else {
          acc[questionId] = (answer as string).trim();
        }
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
    setShowQuestionTypeModal(true);
  };

  const handleQuestionTypeSelect = (selectedType: QuestionType) => {
    setNewQuestions((prev) => [...prev, defaultQuestionDraft(selectedType)]);
    setShowQuestionTypeModal(false);
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
        const newOptions = question.options.filter((_, i) => i !== index);
        const removedOption = question.options[index];
        // 조건부 로직에서 제거된 옵션 제거
        const newConditionalLogic = { ...question.conditionalLogic };
        if (newConditionalLogic && removedOption) {
          delete newConditionalLogic[removedOption];
        }
        return {
          ...question,
          options: newOptions,
          conditionalLogic: Object.keys(newConditionalLogic).length > 0 ? newConditionalLogic : undefined,
        };
      }),
    );
  };

  const handleConditionalLogicChange = (questionId: string, option: string, targetQuestionId: string) => {
    setNewQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) {
          return question;
        }
        const newConditionalLogic = question.conditionalLogic ? { ...question.conditionalLogic } : {};
        if (targetQuestionId) {
          newConditionalLogic[option] = targetQuestionId;
        } else {
          delete newConditionalLogic[option];
        }
        return {
          ...question,
          conditionalLogic: Object.keys(newConditionalLogic).length > 0 ? newConditionalLogic : undefined,
        };
      }),
    );
  };

  const resetNewSurveyForm = () => {
    setNewSurveyTitle("");
    setNewQuestions([defaultQuestionDraft("객관식(단일)")]);
    setShowQuestionTypeModal(false);
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
        isObjectiveType(question.type)
          ? question.options.map((option) => option.trim()).filter(Boolean)
          : [];
      if (isObjectiveType(question.type) && options.length < 2) {
        setNewSurveyFeedback("객관식 문항은 2개 이상의 선택지를 입력해주세요.");
        return;
      }
      preparedQuestions.push({
        id: crypto.randomUUID(),
        prompt,
        type: question.type,
        options,
        conditionalLogic: question.conditionalLogic,
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
            options: isObjectiveType(question.type) ? question.options : [],
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

  const handleLoadSurveyForEdit = (survey?: Survey) => {
    const targetSurvey = survey ?? currentAdminSurvey;
    if (!targetSurvey) {
      setNewSurveyFeedback("불러올 설문이 없습니다.");
      return;
    }
    setNewSurveyTitle(targetSurvey.title);
    setNewQuestions(
      targetSurvey.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        options:
          isObjectiveType(question.type)
            ? question.options && question.options.length > 0
              ? question.options
              : [...defaultChoiceOptions]
            : [],
        conditionalLogic: question.conditionalLogic,
      })),
    );
    setNewSurveyFeedback("선택한 설문을 수정용으로 불러왔습니다.");
  };

  const handleUpdateSurvey = async (): Promise<boolean> => {
    if (!currentAdminSurvey) {
      setNewSurveyFeedback("수정할 설문을 선택해주세요.");
      return false;
    }
    setNewSurveyFeedback("");
    if (!newSurveyTitle.trim()) {
      setNewSurveyFeedback("조사표 제목을 입력해주세요.");
      return false;
    }
    const preparedQuestions: Question[] = [];
    for (const question of newQuestions) {
      const prompt = question.prompt.trim();
      if (!prompt) {
        setNewSurveyFeedback("모든 문항에 질문 내용을 입력해주세요.");
        return false;
      }
      const options =
        isObjectiveType(question.type)
          ? question.options.map((option) => option.trim()).filter(Boolean)
          : [];
      if (isObjectiveType(question.type) && options.length < 2) {
        setNewSurveyFeedback("객관식 문항은 2개 이상의 선택지를 입력해주세요.");
        return false;
      }
      preparedQuestions.push({
        id: question.id,
        prompt,
        type: question.type,
        options,
        conditionalLogic: question.conditionalLogic,
      });
    }

    try {
      setIsUpdatingSurvey(true);
      const response = await fetch(`/api/surveys/${currentAdminSurvey.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newSurveyTitle.trim(),
          questions: preparedQuestions.map((question, index) => ({
            id: question.id,
            prompt: question.prompt,
            type: question.type,
            options: isObjectiveType(question.type) ? question.options : [],
            sortOrder: index,
            conditionalLogic: question.conditionalLogic,
          })),
        }),
      });
      if (!response.ok) {
        const { error } = (await response.json()) as { error?: string };
        throw new Error(error ?? "설문 수정에 실패했습니다.");
      }
      setNewSurveyFeedback("선택한 설문이 수정되었습니다.");
      await fetchSurveys();
      return true;
    } catch (error) {
      setNewSurveyFeedback((error as Error).message);
      return false;
    } finally {
      setIsUpdatingSurvey(false);
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
      <header className="relative z-50 border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-400">
              리서치 설문조사
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white">
              리서치 홈페이지
            </h1>
            <p className="text-sm text-slate-300">
              설문조사 홈페이지입니다.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {canUseAdminPanel && (
              <div className="relative functions-dropdown-container">
                <button
                  onClick={() => setShowFunctionsDropdown(!showFunctionsDropdown)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  type="button"
                >
                  [기능]
                </button>
                {showFunctionsDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setShowFunctionsDropdown(false)}
                    />
                    <div className="fixed top-20 right-6 w-48 rounded-md bg-slate-800 shadow-2xl z-[9999] border border-white/10">
                      <button
                        onClick={() => {
                          setShowCreateSurvey(true);
                          setIsEditMode(false);
                          setIsSelectingSurveyForEdit(false);
                          setShowVerificationCodeManagement(false);
                          setShowQuickQuestionTemplates(false);
                          resetNewSurveyForm();
                          setShowFunctionsDropdown(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 rounded-t-md"
                        type="button"
                      >
                        설문조사 추가
                      </button>
                      {(role === "관리자" || role === "마스터") && (
                        <button
                          onClick={() => {
                            setShowQuickQuestionTemplates(true);
                            setShowVerificationCodeManagement(false);
                            setIsSelectingSurveyForEdit(false);
                            setShowCreateSurvey(false);
                            setShowFunctionsDropdown(false);
                            void fetchQuestionTemplates();
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                          type="button"
                        >
                          빠른문항 설정
                        </button>
                      )}
                      {role === "마스터" && (
                        <>
                          <button
                            onClick={() => {
                              setIsSelectingSurveyForEdit(true);
                              setShowVerificationCodeManagement(false);
                              setShowCreateSurvey(false);
                              setShowQuickQuestionTemplates(false);
                              setShowDeploymentManagement(false);
                              setShowFunctionsDropdown(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                            type="button"
                          >
                            설문지 수정
                          </button>
                          <button
                            onClick={() => {
                              setShowDeploymentManagement(true);
                              setShowVerificationCodeManagement(false);
                              setIsSelectingSurveyForEdit(false);
                              setShowCreateSurvey(false);
                              setShowQuickQuestionTemplates(false);
                              setShowFunctionsDropdown(false);
                              if (surveys.length > 0) {
                                setSelectedSurveyForDeployment(surveys[0].id);
                                void fetchRecipients(surveys[0].id);
                              }
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                            type="button"
                          >
                            배포 관리
                          </button>
                          <button
                            onClick={() => {
                              setShowVerificationCodeManagement(true);
                              setIsSelectingSurveyForEdit(false);
                              setShowCreateSurvey(false);
                              setShowQuickQuestionTemplates(false);
                              setShowDeploymentManagement(false);
                              setShowFunctionsDropdown(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 rounded-b-md"
                            type="button"
                          >
                            확인 코드 관리
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="text-right text-xs text-slate-400">
              <p>배포: Vercel</p>
              <p>DB: Supabase</p>
            </div>
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
                {isLoggedIn ? "로그아웃" : "로그인"}
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
                    모든 역할은 확인 코드가 필요합니다. (마스터가 변경 가능)
                  </p>
                </div>
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

                  {visibleEmployeeQuestions.map((question, index) => (
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
                        {/* 객관식(단일) */}
                        {question.type === "객관식(단일)" && (
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
                        )}

                        {/* 객관식(다중선택) */}
                        {question.type === "객관식(다중선택)" && (
                          <div className="mt-3 space-y-2">
                            {question.options.map((option) => {
                              const currentAnswers = employeeAnswers[question.id];
                              const isChecked = Array.isArray(currentAnswers) && currentAnswers.includes(option);
                              return (
                                <label
                                  key={option}
                                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 cursor-pointer hover:bg-slate-700/50 transition"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) =>
                                      handleEmployeeMultipleAnswer(question.id, option, e.target.checked)
                                    }
                                    className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400"
                                  />
                                  <span className="text-sm text-white">{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* 객관식(드롭다운) */}
                        {question.type === "객관식(드롭다운)" && (
                          <select
                            value={Array.isArray(employeeAnswers[question.id]) ? "" : (employeeAnswers[question.id] as string) ?? ""}
                            onChange={(e) => handleEmployeeAnswer(question.id, e.target.value)}
                            className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="" className="text-black">선택하세요</option>
                            {question.options.map((option) => (
                              <option key={option} value={option} className="text-black">
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* 객관식(순위선택) */}
                        {question.type === "객관식(순위선택)" && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-slate-400 mb-2">옵션을 클릭하면 순서대로 순위가 부여됩니다 (1순위부터)</p>
                            {question.options.map((option) => {
                              const currentAnswer = employeeAnswers[question.id];
                              const currentRanks = Array.isArray(currentAnswer) 
                                ? [] 
                                : (currentAnswer as string)?.split(",").filter(Boolean) || [];
                              const rankIndex = currentRanks.indexOf(option);
                              const rank = rankIndex >= 0 ? rankIndex + 1 : null;
                              
                              return (
                                <button
                                  key={option}
                                  onClick={() => {
                                    const current = employeeAnswers[question.id];
                                    const currentRanks = Array.isArray(current) 
                                      ? [] 
                                      : (current as string)?.split(",").filter(Boolean) || [];
                                    
                                    // 이미 순위가 있으면 제거, 없으면 추가
                                    if (currentRanks.includes(option)) {
                                      // 제거하고 순위 재정렬
                                      const newRanks = currentRanks.filter((item) => item !== option);
                                      handleEmployeeAnswer(question.id, newRanks.join(","));
                                    } else {
                                      // 맨 뒤에 추가 (다음 순위)
                                      const newRanks = [...currentRanks, option];
                                      handleEmployeeAnswer(question.id, newRanks.join(","));
                                    }
                                  }}
                                  type="button"
                                  className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                                    rank
                                      ? "border-cyan-400 bg-cyan-400/20 text-cyan-100"
                                      : "border-white/10 bg-slate-800/50 text-white hover:bg-slate-700/50"
                                  }`}
                                >
                                  <span className="text-sm">{option}</span>
                                  {rank && (
                                    <span className="text-sm font-semibold text-cyan-300">
                                      {rank}순위
                                    </span>
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
                            value={Array.isArray(employeeAnswers[question.id]) ? "" : (employeeAnswers[question.id] as string) ?? ""}
                            onChange={(e) => handleEmployeeAnswer(question.id, e.target.value)}
                            placeholder="답변을 입력하세요"
                            className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                          />
                        )}

                        {/* 서술형 */}
                        {question.type === "서술형" && (
                          <textarea
                            value={Array.isArray(employeeAnswers[question.id]) ? "" : (employeeAnswers[question.id] as string) ?? ""}
                            onChange={(e) => handleEmployeeAnswer(question.id, e.target.value)}
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
              <section className="relative z-0 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
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
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">사원별 입력 수</p>
                      <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
                        완료된 조사표: <span className="font-semibold text-emerald-400">{completedCount}</span>
                      </div>
                    </div>
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
                          {isObjectiveType(question.type) ? (
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

                  {isSelectingSurveyForEdit && !showVerificationCodeManagement && (
                    <div className="rounded-xl border border-dashed border-cyan-400/40 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-white">수정할 설문지 선택</p>
                        <button
                          onClick={() => {
                            setIsSelectingSurveyForEdit(false);
                          }}
                          type="button"
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          ✕ 닫기
                        </button>
                      </div>
                      <p className="mb-4 text-xs text-slate-400">
                        수정할 설문지를 선택해주세요.
                      </p>
                      <div className="space-y-2">
                        {surveys.length === 0 ? (
                          <p className="text-sm text-slate-400">수정할 설문이 없습니다.</p>
                        ) : (
                          surveys.map((survey) => (
                            <button
                              key={survey.id}
                              onClick={() => {
                                setAdminSurveyId(survey.id);
                                handleLoadSurveyForEdit(survey);
                                setShowCreateSurvey(true);
                                setIsEditMode(true);
                                setIsSelectingSurveyForEdit(false);
                              }}
                              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3 text-left text-sm text-white transition hover:border-cyan-400 hover:bg-slate-800"
                              type="button"
                            >
                              <p className="font-semibold">{survey.title}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                문항 {survey.questions.length}개 · 응답 {survey.responses.length}개
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {!isSelectingSurveyForEdit && !showVerificationCodeManagement && !showDeploymentManagement && showCreateSurvey && (
                  <div className="rounded-xl border border-dashed border-cyan-400/40 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-white">
                        {isEditMode ? "설문지 수정" : "설문조사 추가"}
                      </p>
                      <button
                        onClick={() => {
                          setShowCreateSurvey(false);
                          setIsEditMode(false);
                          setIsSelectingSurveyForEdit(false);
                          resetNewSurveyForm();
                        }}
                        type="button"
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ✕ 닫기
                      </button>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="text-xs text-slate-400">조사표 제목</label>
                      <div className="flex gap-2">
                        <input
                          value={newSurveyTitle}
                          onChange={(event) => setNewSurveyTitle(event.target.value)}
                          placeholder="예: 신규 복지 아이디어"
                          className="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                        {isEditMode && role === "마스터" && currentAdminSurvey && (
                          <div className="rounded-lg border border-cyan-400/60 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300">
                            수정 중: {currentAdminSurvey.title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 space-y-5">
                      {newQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="rounded-lg border border-white/10 bg-slate-950/50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">
                                문항 {index + 1}
                              </p>
                              {isObjectiveType(question.type) && newQuestions.length > index + 1 && (
                                <button
                                  onClick={() => {
                                    // 조건부 로직 활성화/비활성화 토글
                                    const hasConditionalLogic = question.conditionalLogic && Object.keys(question.conditionalLogic).length > 0;
                                    if (hasConditionalLogic) {
                                      // 비활성화 - 모든 옵션의 조건 제거
                                      setNewQuestions((prev) =>
                                        prev.map((q) =>
                                          q.id === question.id
                                            ? { ...q, conditionalLogic: undefined }
                                            : q,
                                        ),
                                      );
                                    } else {
                                      // 활성화 - 기본값 설정 (각 옵션을 다음 질문으로 설정)
                                      const newLogic: ConditionalLogic = {};
                                      question.options.forEach((opt) => {
                                        // 기본적으로 다음 질문으로 설정
                                        if (newQuestions[index + 1]) {
                                          newLogic[opt] = newQuestions[index + 1].id;
                                        }
                                      });
                                      setNewQuestions((prev) =>
                                        prev.map((q) =>
                                          q.id === question.id
                                            ? { ...q, conditionalLogic: newLogic }
                                            : q,
                                        ),
                                      );
                                    }
                                  }}
                                  type="button"
                                  className={`text-xs px-2 py-1 rounded transition ${
                                    question.conditionalLogic && Object.keys(question.conditionalLogic).length > 0
                                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30"
                                      : "bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
                                  }`}
                                >
                                  {question.conditionalLogic && Object.keys(question.conditionalLogic).length > 0
                                    ? "조건 수정"
                                    : "조건 추가"}
                                </button>
                              )}
                            </div>
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
                            <div className="mt-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-300">
                              {question.type}
                            </div>
                          </div>
                          {isObjectiveType(question.type) && (
                            <div className="mt-3 space-y-2">
                              {/* 템플릿 불러오기 버튼 */}
                              {showCreateSurvey && !isEditMode && (
                                <div className="mb-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2">
                                  <p className="text-xs text-cyan-300 mb-2">템플릿에서 불러오기:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {questionTemplates
                                      .filter(t => t.question_type === question.type)
                                      .map((template) => (
                                        <button
                                          key={template.id}
                                          onClick={() => {
                                            setNewQuestions((prev) =>
                                              prev.map((q) =>
                                                q.id === question.id
                                                  ? { ...q, options: [...template.options] }
                                                  : q,
                                              ),
                                            );
                                          }}
                                          type="button"
                                          className="rounded-full border border-cyan-400/50 bg-slate-800 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-400/20"
                                        >
                                          {template.name}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="space-y-2">
                                  <div className="flex gap-2">
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
                                  {/* 분기 로직 설정 (조건부 로직이 활성화된 경우) */}
                                  {question.conditionalLogic && Object.keys(question.conditionalLogic).length > 0 && newQuestions.length > index + 1 && (
                                    <div className="ml-2 flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-slate-900/40 p-2">
                                      <label className="text-xs text-slate-400 whitespace-nowrap">
                                        &quot;{option}&quot; 선택 시:
                                      </label>
                                      <select
                                        value={question.conditionalLogic?.[option] ?? ""}
                                        onChange={(event) =>
                                          handleConditionalLogicChange(
                                            question.id,
                                            option,
                                            event.target.value,
                                          )
                                        }
                                        className="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                      >
                                        <option value="" className="text-black">
                                          다음 질문 계속
                                        </option>
                                        {newQuestions.slice(index + 1).map((nextQuestion, nextIndex) => (
                                          <option
                                            key={nextQuestion.id}
                                            value={nextQuestion.id}
                                            className="text-black"
                                          >
                                            문항 {index + nextIndex + 2}로 이동
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
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

                    {/* 문항 유형 선택 모달 */}
                    {showQuestionTypeModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">문항 유형 선택</h3>
                            <button
                              onClick={() => setShowQuestionTypeModal(false)}
                              type="button"
                              className="text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="space-y-4">
                            {/* 객관식 섹션 */}
                            <div>
                              <p className="text-sm font-semibold text-cyan-300 mb-2">객관식</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleQuestionTypeSelect("객관식(단일)")}
                                  type="button"
                                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white transition hover:border-cyan-400 hover:bg-slate-700"
                                >
                                  객관식(단일)
                                </button>
                                <button
                                  onClick={() => handleQuestionTypeSelect("객관식(다중선택)")}
                                  type="button"
                                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white transition hover:border-cyan-400 hover:bg-slate-700"
                                >
                                  객관식(다중선택)
                                </button>
                                <button
                                  onClick={() => handleQuestionTypeSelect("객관식(드롭다운)")}
                                  type="button"
                                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white transition hover:border-cyan-400 hover:bg-slate-700"
                                >
                                  객관식(드롭다운)
                                </button>
                                <button
                                  onClick={() => handleQuestionTypeSelect("객관식(순위선택)")}
                                  type="button"
                                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white transition hover:border-cyan-400 hover:bg-slate-700"
                                >
                                  객관식(순위선택)
                                </button>
                              </div>
                            </div>

                            {/* 주관식 섹션 */}
                            <div>
                              <p className="text-sm font-semibold text-emerald-300 mb-2">주관식</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleQuestionTypeSelect("단답형")}
                                  type="button"
                                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white transition hover:border-emerald-400 hover:bg-slate-700"
                                >
                                  단답형
                                </button>
                                <button
                                  onClick={() => handleQuestionTypeSelect("서술형")}
                                  type="button"
                                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white transition hover:border-emerald-400 hover:bg-slate-700"
                                >
                                  서술형
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {newSurveyFeedback && (
                      <p className="mt-4 text-xs text-cyan-300">{newSurveyFeedback}</p>
                    )}

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                      {!isEditMode && (
                        <button
                          onClick={handleAddSurvey}
                          disabled={isCreatingSurvey}
                          className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                        >
                          {isCreatingSurvey ? "생성 중..." : "설문 생성"}
                        </button>
                      )}
                      {isEditMode && role === "마스터" && currentAdminSurvey && (
                        <button
                          onClick={async () => {
                            const success = await handleUpdateSurvey();
                            if (success) {
                              setIsEditMode(false);
                              setShowCreateSurvey(false);
                              setIsSelectingSurveyForEdit(false);
                              resetNewSurveyForm();
                            }
                          }}
                          disabled={isUpdatingSurvey}
                          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                        >
                          {isUpdatingSurvey ? "수정 중..." : "설문 수정 완료"}
                        </button>
                      )}
                    </div>
                  </div>
                  )}
                </div>

              </section>
            )}

            {(role === "관리자" || role === "마스터") && isLoggedIn && showQuickQuestionTemplates && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">빠른문항 설정</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      객관식 문항을 빠르게 생성하기 위한 템플릿을 관리합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowQuickQuestionTemplates(false);
                    }}
                    type="button"
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕ 닫기
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  {/* 템플릿 생성 폼 */}
                  <div className="rounded-xl border border-dashed border-cyan-400/40 bg-slate-950/40 p-4">
                    <h3 className="text-sm font-semibold text-white mb-4">새 템플릿 생성</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-400">템플릿 이름</label>
                        <input
                          type="text"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="예: 만족도 조사 (6점 척도)"
                          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">질문 유형</label>
                        <select
                          value={newTemplateType}
                          onChange={(e) => setNewTemplateType(e.target.value as typeof newTemplateType)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="객관식(단일)" className="text-black">객관식(단일)</option>
                          <option value="객관식(다중선택)" className="text-black">객관식(다중선택)</option>
                          <option value="객관식(드롭다운)" className="text-black">객관식(드롭다운)</option>
                          <option value="객관식(순위선택)" className="text-black">객관식(순위선택)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">선택지 옵션</label>
                        <div className="mt-1 space-y-2">
                          {newTemplateOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...newTemplateOptions];
                                  newOptions[index] = e.target.value;
                                  setNewTemplateOptions(newOptions);
                                }}
                                placeholder={`옵션 ${index + 1}`}
                                className="flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (newTemplateOptions.length > 1) {
                                    setNewTemplateOptions(newTemplateOptions.filter((_, i) => i !== index));
                                  }
                                }}
                                type="button"
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-red-400 hover:text-red-400"
                                disabled={newTemplateOptions.length <= 1}
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setNewTemplateOptions([...newTemplateOptions, ""])}
                            type="button"
                            className="w-full rounded-lg border border-cyan-400/60 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/10"
                          >
                            옵션 추가
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleCreateTemplate()}
                        disabled={isCreatingTemplate}
                        className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                      >
                        {isCreatingTemplate ? "생성 중..." : "템플릿 저장"}
                      </button>
                    </div>
                  </div>

                  {/* 저장된 템플릿 목록 */}
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <h3 className="text-sm font-semibold text-white mb-4">저장된 템플릿</h3>
                    {questionTemplates.length === 0 ? (
                      <p className="text-sm text-slate-400">저장된 템플릿이 없습니다.</p>
                    ) : (
                      <div className="space-y-2">
                        {questionTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">{template.name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {template.question_type} · {template.options.length}개 옵션
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {template.options.slice(0, 3).map((opt, idx) => (
                                  <span key={idx} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                                    {opt}
                                  </span>
                                ))}
                                {template.options.length > 3 && (
                                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                                    +{template.options.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => void handleDeleteTemplate(template.id)}
                              type="button"
                              className="ml-4 rounded-lg border border-red-400/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {role === "마스터" && isLoggedIn && showDeploymentManagement && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">배포 관리</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      엑셀 파일을 업로드하여 수신자를 등록하고, 설문조사 링크를 이메일로 발송합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeploymentManagement(false);
                    }}
                    type="button"
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕ 닫기
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  {/* 설문 선택 */}
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <label className="text-sm font-semibold text-white mb-2 block">설문 선택</label>
                    <select
                      value={selectedSurveyForDeployment}
                      onChange={(e) => {
                        setSelectedSurveyForDeployment(e.target.value);
                        void fetchRecipients(e.target.value);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="" className="text-black">설문을 선택하세요</option>
                      {surveys.map((survey) => (
                        <option key={survey.id} value={survey.id} className="text-black">
                          {survey.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 엑셀 파일 업로드 */}
                  {selectedSurveyForDeployment && (
                    <div className="rounded-xl border border-dashed border-cyan-400/40 bg-slate-950/40 p-4">
                      <h3 className="text-sm font-semibold text-white mb-4">수신자 목록 업로드</h3>
                      <p className="text-xs text-slate-400 mb-3">
                        엑셀 파일 형식: A열=이름, B열=이메일주소 (1행은 헤더)
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleUploadRecipients}
                        disabled={isUploadingRecipients}
                        className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 disabled:opacity-50"
                      />
                      {isUploadingRecipients && (
                        <p className="mt-2 text-xs text-cyan-300">업로드 중...</p>
                      )}
                    </div>
                  )}

                  {/* 수신자 목록 */}
                  {selectedSurveyForDeployment && recipients.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">
                          수신자 목록 ({recipients.length}명)
                        </h3>
                        <button
                          onClick={handleSendEmails}
                          disabled={isSendingEmails || recipients.filter((r) => !r.email_sent).length === 0}
                          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                        >
                          {isSendingEmails ? "발송 중..." : "이메일 발송"}
                        </button>
                      </div>
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {recipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className={`flex items-center justify-between rounded-lg border p-2 ${
                              recipient.email_sent
                                ? "border-emerald-400/50 bg-emerald-400/10"
                                : "border-white/10 bg-slate-900/50"
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm text-white">{recipient.name}</p>
                              <p className="text-xs text-slate-400">{recipient.email}</p>
                            </div>
                            {recipient.email_sent && (
                              <div className="text-xs text-emerald-400">
                                발송 완료
                                {recipient.email_sent_at && (
                                  <div className="text-slate-500">
                                    {new Date(recipient.email_sent_at).toLocaleString("ko-KR")}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {deploymentMessage && (
                    <p
                      className={`text-xs ${
                        deploymentMessage.includes("성공") ||
                        deploymentMessage.includes("완료") ||
                        deploymentMessage.includes("저장")
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {deploymentMessage}
                    </p>
                  )}
                </div>
              </section>
            )}

            {role === "마스터" && isLoggedIn && showVerificationCodeManagement && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">확인 코드 관리</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      관리자 및 마스터 회원가입에 사용되는 확인 코드를 관리합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowVerificationCodeManagement(false);
                    }}
                    type="button"
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕ 닫기
                  </button>
                </div>

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

