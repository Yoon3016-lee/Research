"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  role: "직원" | "관리자" | "마스터";
};

type Survey = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  deletedAt?: string | null;
  questions: Array<{
    id: string;
    prompt: string;
    type: string;
  }>;
  responses?: Array<{
    id: string;
    employee: string;
    submittedAt: string;
    answers: Record<string, string>;
  }>;
};

type Recipient = {
  id: string;
  survey_id: string;
  name: string;
  email: string;
  sent_at: string | null;
};

type TabType = "list" | "deleted" | "distribution";

export default function MySurveysPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("list");
  
  // 설문 목록 관련
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [deletedSurveys, setDeletedSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // 배포 관리 관련
  const [selectedSurveyForDistribution, setSelectedSurveyForDistribution] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isUploadingRecipients, setIsUploadingRecipients] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [deploymentMessage, setDeploymentMessage] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login?redirect=/my-surveys");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser) as User;
      if (parsedUser.role !== "관리자" && parsedUser.role !== "마스터") {
        router.push("/");
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      router.push("/login?redirect=/my-surveys");
      return;
    }
  }, [router]);

  const fetchSurveys = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/surveys");
      if (!response.ok) {
        throw new Error("설문 목록을 불러오는데 실패했습니다.");
      }
      const result = await response.json();
      if (result.data) {
        const allSurveys = result.data as Survey[];
        setSurveys(allSurveys.filter((s) => !s.deletedAt));
        setDeletedSurveys(allSurveys.filter((s) => s.deletedAt));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchSurveys();
    }
  }, [user, fetchSurveys]);

  // Soft delete: deleted_at 설정
  const handleSoftDelete = async (surveyId: string) => {
    if (!confirm("이 설문을 삭제하시겠습니까? 삭제된 설문은 '삭제된 설문지' 탭에서 확인할 수 있습니다.")) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletingId(surveyId);

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deletedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "설문 삭제에 실패했습니다.");
      }

      await fetchSurveys();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // 복원
  const handleRestore = async (surveyId: string) => {
    try {
      setIsRestoring(true);
      setRestoringId(surveyId);

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deletedAt: null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "설문 복원에 실패했습니다.");
      }

      await fetchSurveys();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsRestoring(false);
      setRestoringId(null);
    }
  };

  // 영구 삭제
  const handlePermanentDelete = async (surveyId: string) => {
    if (!confirm("정말로 이 설문을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletingId(surveyId);

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "설문 영구 삭제에 실패했습니다.");
      }

      await fetchSurveys();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (surveyId: string) => {
    router.push(`/create-survey?edit=${surveyId}`);
  };

  // 배포 관리 함수들
  const fetchRecipients = useCallback(async (surveyId: string) => {
    if (!surveyId) return;
    try {
      setIsLoadingRecipients(true);
      const response = await fetch(`/api/recipients?surveyId=${surveyId}`);
      if (!response.ok) {
        throw new Error("수신자 목록을 불러오는데 실패했습니다.");
      }
      const result = await response.json();
      setRecipients(result.data || []);
    } catch (err) {
      setDeploymentMessage((err as Error).message);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
    }
  };

  const handleUploadRecipients = async () => {
    if (!excelFile || !selectedSurveyForDistribution) {
      setDeploymentMessage("엑셀 파일과 설문을 선택해주세요.");
      return;
    }

    try {
      setIsUploadingRecipients(true);
      setDeploymentMessage("");

      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("surveyId", selectedSurveyForDistribution);

      const response = await fetch("/api/recipients", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "수신자 업로드에 실패했습니다.");
      }

      setDeploymentMessage(result.message ?? "수신자가 업로드되었습니다.");
      setExcelFile(null);
      // 파일 입력 초기화
      const fileInput = document.getElementById("excel-file-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
      await fetchRecipients(selectedSurveyForDistribution);
    } catch (error) {
      setDeploymentMessage((error as Error).message);
    } finally {
      setIsUploadingRecipients(false);
    }
  };

  const handleSendEmails = async () => {
    if (!selectedSurveyForDistribution) {
      setDeploymentMessage("설문을 선택해주세요.");
      return;
    }

    const targetSurvey = surveys.find((s) => s.id === selectedSurveyForDistribution);
    if (!targetSurvey) {
      setDeploymentMessage("선택한 설문을 찾을 수 없습니다.");
      return;
    }

    const unsentRecipients = recipients.filter((r) => !r.sent_at);
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
          surveyId: selectedSurveyForDistribution,
          surveyTitle: targetSurvey.title,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error ?? "이메일 발송에 실패했습니다.";
        let fullErrorMsg = errorMsg;
        
        if (result.helpMessage) {
          fullErrorMsg += `\n\n${result.helpMessage}`;
        }
        
        if (result.missingVariables) {
          fullErrorMsg += `\n\n누락된 환경변수: ${result.missingVariables.join(", ")}`;
        }
        
        if (result.details && process.env.NODE_ENV === "development") {
          const safeDetails = { ...result.details };
          if (safeDetails.user) {
            safeDetails.user = safeDetails.user.replace(/(.{2}).*(@.*)/, "$1***$2");
          }
          fullErrorMsg += `\n\n[개발 모드] 상세 오류:\n${JSON.stringify(safeDetails, null, 2)}`;
        }
        
        throw new Error(fullErrorMsg);
      }

      let message = result.message ?? "이메일이 발송되었습니다.";
      if (result.failedDetails && result.failedDetails.length > 0) {
        message += "\n\n[실패 상세 정보]\n";
        result.failedDetails.forEach((failed: { email: string; error: string; details?: unknown }) => {
          message += `\n📧 ${failed.email}\n`;
          message += `   오류: ${failed.error}\n`;
          if (failed.details) {
            const detailsStr = typeof failed.details === "string" 
              ? failed.details 
              : JSON.stringify(failed.details, null, 2);
            message += `   상세: ${detailsStr}\n`;
          }
        });
      }

      setDeploymentMessage(message);
      await fetchRecipients(selectedSurveyForDistribution);
    } catch (error) {
      setDeploymentMessage((error as Error).message);
    } finally {
      setIsSendingEmails(false);
    }
  };

  useEffect(() => {
    if (activeTab === "distribution" && selectedSurveyForDistribution) {
      void fetchRecipients(selectedSurveyForDistribution);
    }
  }, [activeTab, selectedSurveyForDistribution, fetchRecipients]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-400">인증 확인 중...</p>
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
              <h1 className="text-3xl font-bold text-slate-900">my설문함</h1>
              <p className="mt-2 text-slate-600">생성한 설문을 관리하세요</p>
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
        <div className="flex gap-6">
          {/* 왼쪽 메뉴 탭 */}
          <div className="w-64 flex-shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <Link
                href="/create-survey"
                className="w-full block text-center px-4 py-3 rounded-lg text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-600 transition"
              >
                설문지 생성하기
              </Link>
              <button
                onClick={() => setActiveTab("list")}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                  activeTab === "list"
                    ? "bg-cyan-500 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                type="button"
              >
                설문지 목록
              </button>
              <button
                onClick={() => setActiveTab("deleted")}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                  activeTab === "deleted"
                    ? "bg-cyan-500 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                type="button"
              >
                삭제된 설문지
              </button>
              {user.role === "마스터" && (
                <button
                  onClick={() => setActiveTab("distribution")}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                    activeTab === "distribution"
                      ? "bg-cyan-500 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  type="button"
                >
                  배포 관리
                </button>
              )}
            </div>
          </div>

          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-1">
            {/* 설문지 목록 탭 */}
            {activeTab === "list" && (
              <>
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400">설문 목록을 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-red-300">
                    {error}
                  </div>
                ) : surveys.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 mb-4">생성된 설문이 없습니다.</p>
                    <Link
                      href="/create-survey"
                      className="inline-block rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                      설문 만들기
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="divide-y divide-slate-200">
                      {surveys.map((survey) => (
                        <div
                          key={survey.id}
                          className="flex items-center justify-between p-6 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          <Link
                            href={`/survey/${survey.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 hover:text-cyan-600 transition">
                                {survey.title}
                              </h3>
                              {survey.description && (
                                <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                                  {survey.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <span>문항 수: {survey.questions.length}</span>
                                {survey.createdAt && (
                                  <span>
                                    생성일: {new Date(survey.createdAt).toLocaleDateString("ko-KR")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>

                          <div className="flex items-center gap-3 ml-4">
                            {user.role === "마스터" && (
                              <>
                                <Link
                                  href={`/survey-responses/${survey.id}`}
                                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                                >
                                  응답확인
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleEdit(survey.id);
                                  }}
                                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
                                  type="button"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    void handleSoftDelete(survey.id);
                                  }}
                                  disabled={isDeleting && deletingId === survey.id}
                                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                >
                                  {isDeleting && deletingId === survey.id ? "삭제 중..." : "삭제"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 삭제된 설문지 탭 */}
            {activeTab === "deleted" && (
              <>
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400">삭제된 설문 목록을 불러오는 중...</p>
                  </div>
                ) : deletedSurveys.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400">삭제된 설문이 없습니다.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="divide-y divide-slate-200">
                      {deletedSurveys.map((survey) => (
                        <div
                          key={survey.id}
                          className="flex items-center justify-between p-6 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-600 line-through">
                              {survey.title}
                            </h3>
                            {survey.description && (
                              <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                                {survey.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span>문항 수: {survey.questions.length}</span>
                              {survey.deletedAt && (
                                <span>
                                  삭제일: {new Date(survey.deletedAt).toLocaleDateString("ko-KR")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            {user.role === "마스터" && (
                              <>
                                <button
                                  onClick={() => void handleRestore(survey.id)}
                                  disabled={isRestoring && restoringId === survey.id}
                                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                >
                                  {isRestoring && restoringId === survey.id ? "복원 중..." : "복원"}
                                </button>
                                <button
                                  onClick={() => void handlePermanentDelete(survey.id)}
                                  disabled={isDeleting && deletingId === survey.id}
                                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  type="button"
                                >
                                  {isDeleting && deletingId === survey.id ? "삭제 중..." : "영구 삭제"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 배포 관리 탭 */}
            {activeTab === "distribution" && user.role === "마스터" && (
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">배포 관리</h2>
                  <p className="text-sm text-slate-400">
                    설문 대상자를 관리하고 설문 링크를 이메일로 발송합니다.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 설문 선택 */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">설문 선택</label>
                    <select
                      value={selectedSurveyForDistribution}
                      onChange={(e) => {
                        setSelectedSurveyForDistribution(e.target.value);
                        if (e.target.value) {
                          void fetchRecipients(e.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="">설문을 선택하세요</option>
                      {surveys.map((survey) => (
                        <option key={survey.id} value={survey.id}>
                          {survey.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 엑셀 파일 업로드 */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      수신자 엑셀 파일 업로드 (A열: 이름, B열: 이메일)
                    </label>
                    <input
                      id="excel-file-input"
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleExcelFileChange}
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30"
                    />
                    <button
                      onClick={() => void handleUploadRecipients()}
                      disabled={!excelFile || isUploadingRecipients || !selectedSurveyForDistribution}
                      className="mt-2 w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                    >
                      {isUploadingRecipients ? "업로드 중..." : "수신자 목록 업로드 및 저장"}
                    </button>
                  </div>

                  {/* 수신자 목록 */}
                  <div>
                    <h3 className="text-md font-semibold text-white mb-2">등록된 수신자 목록</h3>
                    {isLoadingRecipients ? (
                      <p className="text-sm text-slate-400">수신자 목록을 불러오는 중...</p>
                    ) : recipients.length === 0 ? (
                      <p className="text-sm text-slate-400">등록된 수신자가 없습니다.</p>
                    ) : (
                      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {recipients.map((recipient) => (
                          <li key={recipient.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 p-3">
                            <div>
                              <p className="text-sm text-white">{recipient.name} ({recipient.email})</p>
                              <p className="text-xs text-slate-400">
                                설문: {surveys.find(s => s.id === recipient.survey_id)?.title || '알 수 없음'}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold ${recipient.sent_at ? 'text-emerald-400' : 'text-orange-400'}`}>
                              {recipient.sent_at ? `발송됨 (${new Date(recipient.sent_at).toLocaleDateString()})` : '미발송'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 이메일 발송 버튼 */}
                  <button
                    onClick={() => void handleSendEmails()}
                    disabled={recipients.length === 0 || isSendingEmails || !selectedSurveyForDistribution}
                    className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                  >
                    {isSendingEmails ? "이메일 발송 중..." : "선택된 설문 이메일 발송"}
                  </button>

                  {/* 메시지 표시 */}
                  {deploymentMessage && (
                    <div className={`rounded-lg px-4 py-3 text-sm whitespace-pre-line ${
                      deploymentMessage.includes("실패") || deploymentMessage.includes("오류")
                        ? "bg-red-500/20 border border-red-500/50 text-red-300"
                        : "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                    }`}>
                      {deploymentMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
