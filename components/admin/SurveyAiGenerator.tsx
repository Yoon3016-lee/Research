"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateSurveyAiAction,
  getSurveyAiConfigAction,
  lookupKsicAction,
  searchKsicAction,
} from "@/app/actions/generate-survey-ai";
import type { KsicEntry } from "@/lib/survey-ai/ksic";
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
  Loader2,
  Search,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalCount, setProposalCount] = useState(2);
  const [ksicQuery, setKsicQuery] = useState("");
  const [ksicResults, setKsicResults] = useState<KsicEntry[]>([]);
  const [ksicSearching, startKsicSearch] = useTransition();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void getSurveyAiConfigAction().then((c) => setProposalCount(c.proposalCount));
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

  const selectKsic = (entry: KsicEntry) => {
    updateBrief({ ksicCode: entry.code, ksicName: entry.name });
    setKsicQuery(`${entry.code} ${entry.name}`);
    setKsicResults([]);
  };

  const handleKsicCodeBlur = async () => {
    const code = brief.ksicCode.trim();
    if (!code) return;
    const found = await lookupKsicAction(code);
    if (found && !brief.ksicName.trim()) {
      updateBrief({ ksicName: found.name });
    }
  };

  const runGenerate = (nextBrief: SurveyAiBrief) => {
    setError(null);
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
      },
    };

    sessionStorage.setItem(SURVEY_AI_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    router.push("/admin/surveys/new?from=ai");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
          <div className="text-sm text-indigo-950">
            <p className="font-medium">KSIC 기반 AI 설문 생성</p>
            <p className="mt-1 text-indigo-800/90">
              산업 분류·조사 목적을 입력하면 AI가 설문안 {proposalCount}개와 CATI 조사원
              스크립트·추천 근거를 제안합니다. 정보가 부족하면 보완 질문을 드립니다.
            </p>
          </div>
        </div>
      </div>

      {step === "input" ? (
        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">KSIC (한국표준산업분류)</h2>
            <p className="mt-1 text-sm text-zinc-500">
              코드 또는 산업명으로 검색해 선택하세요. 5자리 세분류 코드를 직접 입력해도 됩니다.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                value={ksicQuery}
                onChange={(e) => setKsicQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleKsicSearch();
                  }
                }}
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="예: 56121, 커피, 정보통신"
              />
              <button
                type="button"
                onClick={handleKsicSearch}
                disabled={ksicSearching}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
              >
                {ksicSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="h-4 w-4" aria-hidden />
                )}
                검색
              </button>
            </div>

            {ksicResults.length > 0 ? (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50">
                {ksicResults.map((entry) => (
                  <li key={entry.code}>
                    <button
                      type="button"
                      onClick={() => selectKsic(entry)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-white"
                    >
                      <span>
                        <strong className="font-mono text-indigo-800">{entry.code}</strong>{" "}
                        {entry.name}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">KSIC 코드 *</span>
                <input
                  required
                  value={brief.ksicCode}
                  onChange={(e) => updateBrief({ ksicCode: e.target.value })}
                  onBlur={() => void handleKsicCodeBlur()}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="예: 56121"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">산업 명칭</span>
                <input
                  value={brief.ksicName}
                  onChange={(e) => updateBrief({ ksicName: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="검색 선택 시 자동 입력"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">조사 개요</h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">조사 목적 *</span>
                <textarea
                  required
                  value={brief.researchPurpose}
                  onChange={(e) => updateBrief({ researchPurpose: e.target.value })}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="예: 커피 전문점 고객 만족도 및 재방문 의향 파악"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">응답 대상 *</span>
                <input
                  required
                  value={brief.targetRespondent}
                  onChange={(e) => updateBrief({ targetRespondent: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="예: 최근 3개월 내 방문한 20대 이상 개인 고객"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">설문 주제·관심 영역</span>
                <input
                  value={brief.surveyTopic}
                  onChange={(e) => updateBrief({ surveyTopic: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="예: 메뉴·가격·매장 환경·배달 서비스"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">추가 메모</span>
                <textarea
                  value={brief.additionalNotes}
                  onChange={(e) => updateBrief({ additionalNotes: e.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="표본 규모, 조사 방식(CATI/온라인), 경쟁사 비교 등"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 sm:w-auto"
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
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
            <h2 className="text-base font-semibold text-amber-950">보완 정보가 필요합니다</h2>
            <p className="mt-1 text-sm text-amber-900/90">
              아래 질문에 답변해 주시면 더 적합한 설문안을 생성할 수 있습니다.
            </p>
          </section>

          {clarifications.map((c) => (
            <section
              key={c.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <p className="font-medium text-zinc-900">{c.question}</p>
              <p className="mt-1 text-sm text-zinc-500">{c.reason}</p>
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
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-900 hover:bg-indigo-100"
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
                className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="답변을 입력하세요"
              />
            </section>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("input")}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              입력 수정
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              다시 생성
            </button>
          </div>
        </form>
      ) : null}

      {step === "proposals" ? (
        <div className="space-y-6">
          <p className="text-sm text-zinc-600">
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
                      ? "border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-300"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-zinc-900">{p.title}</h3>
                    {selected ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{p.summary}</p>
                  <p className="mt-3 text-xs text-zinc-500">
                    문항 {p.questions.length}개 · CATI 스크립트 포함
                  </p>
                </button>
              );
            })}
          </div>

          {selectedId ? (
            <ProposalDetail proposal={proposals.find((p) => p.id === selectedId)!} />
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-6">
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setProposals([]);
              }}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              처음부터 다시
            </button>
            <button
              type="button"
              onClick={applyProposal}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              선택한 설문안을 편집기에 적용
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ProposalDetail({ proposal }: { proposal: SurveyAiProposal }) {
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">추천 근거</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
          {proposal.rationale}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">KSIC 적합성</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
          {proposal.ksicRelevance}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">문항 미리보기</h3>
        <ol className="mt-3 space-y-2">
          {proposal.questions.map((q, i) => (
            <li
              key={q.clientId}
              className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm"
            >
              <span className="text-xs font-medium text-indigo-700">
                {i + 1}. {QUESTION_TYPE_LABELS[q.type]}
              </span>
              <p className="mt-0.5 text-zinc-800">{q.prompt}</p>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">CATI 스크립트 (일부)</h3>
        <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap">
          {proposal.responseScript.slice(0, 1200)}
          {proposal.responseScript.length > 1200 ? "\n…" : ""}
        </pre>
      </div>
    </div>
  );
}
