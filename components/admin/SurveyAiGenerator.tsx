"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateSurveyAiAction,
  getSurveyAiConfigAction,
  lookupKsicAction,
  searchKsicAction,
  validateKsicExternalAction,
} from "@/app/actions/generate-survey-ai";
import { KsicHierarchyDialog } from "@/components/admin/KsicHierarchyDialog";
import { KsicSelectSection } from "@/components/admin/KsicSelectSection";
import type { KsicExternalValidation } from "@/lib/ksic-external/types";
import type { KsicEntry } from "@/lib/ksic-types";
import {
  SURVEY_AI_DRAFT_STORAGE_KEY,
  type SurveyAiBrief,
  type SurveyAiClarification,
  type SurveyAiDraftPayload,
  type SurveyAiProposal,
} from "@/lib/survey-ai/types";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import {
  addDaysToDateOnly,
  toDateOnlyString,
} from "@/lib/survey-period";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  ListPlus,
  Loader2,
  Sparkles,
} from "lucide-react";

type Step = "input" | "clarify" | "proposals";

const emptyBrief = (): SurveyAiBrief => ({
  ksicCode: "",
  ksicName: "",
  researchPurpose: "",
  targetRespondent: "",
  surveyTopic: "",
  additionalNotes: "",
  clarificationAnswers: {},
});

export function SurveyAiGenerator() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [brief, setBrief] = useState<SurveyAiBrief>(emptyBrief);
  const [clarifications, setClarifications] = useState<SurveyAiClarification[]>([]);
  const [proposals, setProposals] = useState<SurveyAiProposal[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalCount, setProposalCount] = useState(3);
  const [aiProviderLabel, setAiProviderLabel] = useState<string | null>(null);
  const [ksicQuery, setKsicQuery] = useState("");
  const [ksicResults, setKsicResults] = useState<KsicEntry[]>([]);
  const [ksicPickerOpen, setKsicPickerOpen] = useState(false);
  const [ksicPickerKey, setKsicPickerKey] = useState(0);
  const [ksicExternalValidation, setKsicExternalValidation] =
    useState<KsicExternalValidation | null>(null);
  const [ksicValidationLoading, setKsicValidationLoading] = useState(false);
  const [ksicSearching, startKsicSearch] = useTransition();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void getSurveyAiConfigAction().then((c) => {
      if ("error" in c) {
        setError(c.error);
        return;
      }
      setProposalCount(c.proposalCount);
      setAiProviderLabel(c.providerLabel);
    });
  }, []);

  const updateBrief = (patch: Partial<SurveyAiBrief>) => {
    setBrief((prev) => ({ ...prev, ...patch }));
  };

  const handleKsicSearch = () => {
    startKsicSearch(async () => {
      const results = await searchKsicAction(ksicQuery);
      setKsicResults(results);
    });
  };

  const runKsicExternalValidation = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setKsicExternalValidation(null);
      return;
    }
    setKsicValidationLoading(true);
    try {
      const result = await validateKsicExternalAction(trimmed);
      setKsicExternalValidation(result);
    } catch {
      setKsicExternalValidation(null);
    } finally {
      setKsicValidationLoading(false);
    }
  };

  const selectKsic = (entry: KsicEntry) => {
    updateBrief({ ksicCode: entry.code, ksicName: entry.name });
    setKsicQuery(`${entry.code} ${entry.name}`);
    setKsicResults([]);
    void runKsicExternalValidation(entry.code);
  };

  const openKsicPicker = () => {
    setKsicPickerKey((k) => k + 1);
    setKsicPickerOpen(true);
  };

  const handleKsicCodeBlur = async () => {
    const code = brief.ksicCode.trim();
    if (!code) {
      setKsicExternalValidation(null);
      return;
    }
    const found = await lookupKsicAction(code);
    if (found && !brief.ksicName.trim()) {
      updateBrief({ ksicName: found.name });
    }
    await runKsicExternalValidation(code);
  };

  const runGenerate = (nextBrief: SurveyAiBrief) => {
    setError(null);
    setWarnings([]);
    startTransition(async () => {
      const result = await generateSurveyAiAction(nextBrief);
      if (result.status === "error") {
        setError(result.error);
        return;
      }
      if (result.status === "needs_clarification") {
        setClarifications(result.clarifications);
        setStep("clarify");
        return;
      }
      setProposals(result.proposals);
      setWarnings(result.warnings ?? []);
      setSelectedId(result.proposals[0]?.id ?? null);
      setStep("proposals");
    });
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runGenerate(brief);
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const c of clarifications) {
      if (!brief.clarificationAnswers[c.id]?.trim()) {
        setError(`「${c.question}」에 답변해 주세요.`);
        return;
      }
    }
    runGenerate(brief);
  };

  const applyProposal = () => {
    const proposal = proposals.find((p) => p.id === selectedId);
    if (!proposal) {
      setError("적용할 설문안을 선택하세요.");
      return;
    }

    const today = toDateOnlyString();
    const draft: SurveyAiDraftPayload = {
      title: proposal.title,
      summary: proposal.summary,
      periodStart: today,
      periodEnd: addDaysToDateOnly(today, 30),
      targetCount: 100,
      listedPublic: true,
      responseScript: proposal.responseScript,
      questions: proposal.questions,
      aiSource: {
        proposalId: proposal.id,
        rationale: proposal.rationale,
        ksicRelevance: proposal.ksicRelevance,
        improvements: proposal.improvements,
        additionalQuestions: proposal.additionalQuestions,
      },
    };

    sessionStorage.setItem(SURVEY_AI_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    router.push("/admin/surveys/new?from=ai");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-accent-500/25 bg-gradient-to-br from-accent-500/12 to-transparent px-5 py-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden />
          <div className="text-sm text-brand-900">
            <p className="font-medium">KSIC 기반 AI 설문 생성</p>
            <p className="mt-1 text-brand-700">
              산업 분류·조사 목적을 입력하면 AI가 설문안 {proposalCount}개와 CATI 조사원
              스크립트·추천 근거를 제안합니다. 정보가 부족하면 보완 질문을 드립니다.
              {aiProviderLabel ? (
                <span className="mt-1 block text-xs text-brand-700/80">
                  사용 중인 AI: {aiProviderLabel}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {step === "input" ? (
        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <KsicSelectSection
            brief={brief}
            ksicQuery={ksicQuery}
            ksicResults={ksicResults}
            ksicSearching={ksicSearching}
            onBriefChange={updateBrief}
            onKsicQueryChange={setKsicQuery}
            onOpenPicker={openKsicPicker}
            onSearch={handleKsicSearch}
            onSelectSearchResult={selectKsic}
            onCodeBlur={() => void handleKsicCodeBlur()}
            externalValidation={ksicExternalValidation}
            externalValidationLoading={ksicValidationLoading}
          />

          <section className="admin-card p-6">
            <h2 className="text-base font-semibold text-brand-900">조사 개요</h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="admin-label">조사 목적 *</span>
                <textarea
                  required
                  value={brief.researchPurpose}
                  onChange={(e) => updateBrief({ researchPurpose: e.target.value })}
                  rows={3}
                  className="admin-input mt-1.5"
                  placeholder="예: 커피 전문점 고객 만족도 및 재방문 의향 파악"
                />
              </label>
              <label className="block">
                <span className="admin-label">응답 대상 *</span>
                <input
                  required
                  value={brief.targetRespondent}
                  onChange={(e) => updateBrief({ targetRespondent: e.target.value })}
                  className="admin-input mt-1.5"
                  placeholder="예: 최근 3개월 내 방문한 20대 이상 개인 고객"
                />
              </label>
              <label className="block">
                <span className="admin-label">설문 주제·관심 영역</span>
                <input
                  value={brief.surveyTopic}
                  onChange={(e) => updateBrief({ surveyTopic: e.target.value })}
                  className="admin-input mt-1.5"
                  placeholder="예: 메뉴·가격·매장 환경·배달 서비스"
                />
              </label>
              <label className="block">
                <span className="admin-label">추가 메모</span>
                <textarea
                  value={brief.additionalNotes}
                  onChange={(e) => updateBrief({ additionalNotes: e.target.value })}
                  rows={2}
                  className="admin-input mt-1.5"
                  placeholder="표본 규모, 조사 방식(CATI/온라인), 경쟁사 비교 등"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={pending}
            className="admin-btn-primary inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 sm:w-auto"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Bot className="h-4 w-4" aria-hidden />
            )}
            {pending ? "생성 중…" : `AI로 설문 ${proposalCount}안 생성`}
          </button>
        </form>
      ) : null}

      {step === "clarify" ? (
        <form onSubmit={handleClarifySubmit} className="space-y-6">
          <KsicSelectSection
            brief={brief}
            ksicQuery={ksicQuery}
            ksicResults={ksicResults}
            ksicSearching={ksicSearching}
            onBriefChange={updateBrief}
            onKsicQueryChange={setKsicQuery}
            onOpenPicker={openKsicPicker}
            onSearch={handleKsicSearch}
            onSelectSearchResult={selectKsic}
            onCodeBlur={() => void handleKsicCodeBlur()}
            externalValidation={ksicExternalValidation}
            externalValidationLoading={ksicValidationLoading}
            compact
          />

          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
            <h2 className="text-base font-semibold text-amber-950">보완 정보가 필요합니다</h2>
            <p className="mt-1 text-sm text-amber-900/90">
              아래 질문에 답변해 주시면 더 적합한 설문안을 생성할 수 있습니다.
            </p>
          </section>

          {clarifications.map((c) => (
            <section
              key={c.id}
              className="admin-card p-6"
            >
              <p className="font-medium text-brand-900">{c.question}</p>
              <p className="mt-1 text-sm text-brand-700/80">{c.reason}</p>
              {c.suggestions.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        updateBrief({
                          clarificationAnswers: {
                            ...brief.clarificationAnswers,
                            [c.id]: s,
                          },
                        })
                      }
                      className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-brand-900 hover:bg-accent-500/18"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
              <textarea
                required
                value={brief.clarificationAnswers[c.id] ?? ""}
                onChange={(e) =>
                  updateBrief({
                    clarificationAnswers: {
                      ...brief.clarificationAnswers,
                      [c.id]: e.target.value,
                    },
                  })
                }
                rows={2}
                className="admin-input mt-3"
                placeholder="답변을 입력하세요"
              />
            </section>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("input")}
              className="admin-btn-secondary px-5 py-2.5"
            >
              입력 수정
            </button>
            <button
              type="submit"
              disabled={pending}
              className="admin-btn-primary inline-flex items-center gap-2 px-6 py-2.5"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              다시 생성
            </button>
          </div>
        </form>
      ) : null}

      {step === "proposals" ? (
        <div className="space-y-6">
          {warnings.length > 0 ? (
            <div
              className="whitespace-pre-wrap rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              <p className="font-medium">일부 설문안은 형식 오류로 제외되었습니다.</p>
              <p className="mt-2">{warnings.join("\n\n")}</p>
            </div>
          ) : null}

          <p className="text-sm text-brand-700">
            생성된 설문안 {proposals.length}개 중 하나를 선택한 뒤 편집기에 적용하세요.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {proposals.map((p) => {
              const selected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                    selected
                      ? "border-accent-500/50 bg-accent-500/10 ring-2 ring-accent-500/25"
                      : "border-brand-900/10 bg-white hover:border-accent-500/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-brand-900">{p.title}</h3>
                    {selected ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-600" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-brand-700">{p.summary}</p>
                  <p className="mt-3 text-xs text-brand-700/80">
                    문항 {p.questions.length}개 · CATI 스크립트 포함
                  </p>
                </button>
              );
            })}
          </div>

          {selectedId ? (
            <ProposalDetail proposal={proposals.find((p) => p.id === selectedId)!} />
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-brand-900/8 pt-6">
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setProposals([]);
                setWarnings([]);
              }}
              className="admin-btn-secondary px-5 py-2.5"
            >
              처음부터 다시
            </button>
            <button
              type="button"
              onClick={applyProposal}
              className="admin-btn-primary inline-flex items-center gap-2 px-6 py-2.5 disabled:opacity-60"
            >
              선택한 설문안을 편집기에 적용
            </button>
          </div>
        </div>
      ) : null}

      <KsicHierarchyDialog
        open={ksicPickerOpen}
        onClose={() => setKsicPickerOpen(false)}
        resetKey={ksicPickerKey}
        selectedCode={brief.ksicCode.trim() || undefined}
        onSelect={selectKsic}
      />

      {error ? (
        <div
          className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <p>{error}</p>
          {step === "input" ? (
            <button
              type="button"
              onClick={() => runGenerate(brief)}
              disabled={pending}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-50 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              다시 생성
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProposalDetail({ proposal }: { proposal: SurveyAiProposal }) {
  return (
    <div className="admin-card space-y-4 p-6">
      <div>
        <h3 className="text-sm font-semibold text-brand-900">추천 근거</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
          {proposal.rationale}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-brand-900">KSIC 적합성</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
          {proposal.ksicRelevance}
        </p>
      </div>

      {proposal.improvements.length > 0 ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
            보완·개선 제안
          </h3>
          <p className="mt-1 text-xs text-amber-900/80">
            편집기에 적용한 뒤 아래 항목을 참고해 설문을 다듬어 보세요.
          </p>
          <ul className="mt-3 space-y-3">
            {proposal.improvements.map((note, i) => (
              <li
                key={i}
                className="rounded-lg border border-amber-100 bg-white px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-amber-950">{note.area}</span>
                <p className="mt-1 leading-relaxed text-brand-800">{note.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {proposal.additionalQuestions.length > 0 ? (
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-teal-950">
            <ListPlus className="h-4 w-4 shrink-0" aria-hidden />
            추가 문항 생성 방향
          </h3>
          <p className="mt-1 text-xs text-teal-900/80">
            조사 목적을 더 충실히 반영하려면 아래 주제로 문항을 추가하는 것을 권장합니다.
          </p>
          <ul className="mt-3 space-y-3">
            {proposal.additionalQuestions.map((idea, i) => (
              <li
                key={i}
                className="rounded-lg border border-teal-100 bg-white px-3 py-2.5 text-sm"
              >
                <p className="font-medium text-teal-950">{idea.direction}</p>
                {idea.reason ? (
                  <p className="mt-1 text-xs leading-relaxed text-brand-700">{idea.reason}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {idea.suggestedType ? (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900">
                      권장 유형:{" "}
                      {QUESTION_TYPE_LABELS[idea.suggestedType as keyof typeof QUESTION_TYPE_LABELS] ??
                        idea.suggestedType}
                    </span>
                  ) : null}
                </div>
                {idea.examplePrompt ? (
                  <p className="mt-2 rounded-md bg-surface px-2.5 py-2 text-xs leading-relaxed text-brand-800">
                    예시 질문: {idea.examplePrompt}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-brand-900">문항 미리보기</h3>
        <ol className="mt-3 space-y-2">
          {proposal.questions.map((q, i) => (
            <li
              key={q.clientId}
              className="rounded-lg border border-brand-900/6 bg-surface/80 px-3 py-2 text-sm"
            >
              <span className="text-xs font-medium text-accent-600">
                {i + 1}. {QUESTION_TYPE_LABELS[q.type]}
              </span>
              <p className="mt-0.5 text-brand-900">{q.prompt}</p>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-brand-900">CATI 스크립트 (일부)</h3>
        <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-brand-900/6 bg-surface p-3 text-xs leading-relaxed text-brand-800 whitespace-pre-wrap">
          {proposal.responseScript.slice(0, 1200)}
          {proposal.responseScript.length > 1200 ? "\n…" : ""}
        </pre>
      </div>
    </div>
  );
}
