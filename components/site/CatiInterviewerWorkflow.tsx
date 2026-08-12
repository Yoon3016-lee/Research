"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home, PhoneCall, Play, RotateCcw } from "lucide-react";
import {
  applyCatiSampleAction,
  recordCatiContactOutcomeAction,
} from "@/app/actions/cati-samples";
import { saveCatiDraftAction } from "@/app/actions/cati-drafts";
import {
  SurveyResponseForm,
  type SurveyPausePayload,
} from "@/components/site/SurveyResponseForm";
import type { CatiContactOption } from "@/lib/cati-contact-types";
import type { CatiAppliedSample } from "@/lib/cati-sample-types";
import type { PublicSurveyDetail } from "@/lib/survey-public";
import type { SurveyViewMode } from "@/lib/survey-view-mode";

type Phase = "uid" | "contact" | "survey" | "done";

type Props = {
  slug: string;
  survey: PublicSurveyDetail;
  contactOptions: CatiContactOption[];
  viewMode: SurveyViewMode;
};

const toneStyles: Record<
  CatiAppliedSample["statusTone"],
  { badge: string; border: string; bg: string }
> = {
  new: {
    badge: "bg-emerald-100 text-emerald-900",
    border: "border-emerald-200",
    bg: "bg-emerald-50/60",
  },
  info: {
    badge: "bg-sky-100 text-sky-900",
    border: "border-sky-200",
    bg: "bg-sky-50/60",
  },
  warning: {
    badge: "bg-amber-100 text-amber-950",
    border: "border-amber-200",
    bg: "bg-amber-50/60",
  },
  success: {
    badge: "bg-emerald-100 text-emerald-900",
    border: "border-emerald-200",
    bg: "bg-emerald-50/60",
  },
  muted: {
    badge: "bg-zinc-200 text-zinc-800",
    border: "border-zinc-200",
    bg: "bg-zinc-50",
  },
};

export function CatiInterviewerWorkflow({
  slug,
  survey,
  contactOptions,
  viewMode,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("uid");
  const [uidInput, setUidInput] = useState("");
  const [applied, setApplied] = useState<CatiAppliedSample | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [doneUid, setDoneUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [applyPending, startApply] = useTransition();
  const [outcomePending, startOutcome] = useTransition();

  const resetWorkflow = () => {
    setPhase("uid");
    setUidInput("");
    setApplied(null);
    setSelectedOptionId(null);
    setDoneUid(null);
    setError(null);
  };

  const handleApplyUid = () => {
    setError(null);
    setNotice(null);
    startApply(async () => {
      const result = await applyCatiSampleAction(slug, uidInput);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setApplied(result.sample);
      setSelectedOptionId(null);
      setPhase("contact");
    });
  };

  const handleConfirmOutcome = () => {
    if (!applied || !selectedOptionId) return;
    const option = contactOptions.find((o) => o.id === selectedOptionId);
    if (!option) return;
    setError(null);
    startOutcome(async () => {
      const result = await recordCatiContactOutcomeAction(slug, applied.id, option.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.isSuccess) {
        setNotice(null);
        setPhase("survey");
        return;
      }
      const uid = applied.uid;
      resetWorkflow();
      setNotice(`UID ${uid} — 「${result.outcome}」(으)로 기록했습니다. 다음 표본을 조사하세요.`);
    });
  };

  const handleSurveySubmitted = (uid: string) => {
    setNotice(null);
    setError(null);
    setDoneUid(uid);
    setPhase("done");
  };

  const handlePause = async ({
    answers,
    activeQuestionId,
    startedAt,
    activeSeconds,
  }: SurveyPausePayload) => {
    if (!applied) {
      return { ok: false, error: "표본 정보가 없습니다." };
    }
    const result = await saveCatiDraftAction(
      slug,
      applied.id,
      answers,
      activeQuestionId,
      startedAt,
      activeSeconds,
    );
    if (result.ok) {
      const uid = applied.uid;
      resetWorkflow();
      setNotice(
        `UID ${uid} — 진행 내역을 저장했습니다. 나중에 같은 UID를 적용하면 이어서 진행할 수 있습니다.`,
      );
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  const startResume = () => {
    setError(null);
    setNotice(null);
    setPhase("survey");
  };

  const pending = applyPending || outcomePending;
  const tone = applied ? toneStyles[applied.statusTone] : toneStyles.new;
  const selectedOption = contactOptions.find((o) => o.id === selectedOptionId) ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-indigo-950">CATI 표본 조사</h2>
        <p className="mt-1 text-sm text-zinc-600">
          UID를 적용해 전화번호를 확인하고, 통화 후 컨택 결과를 선택하세요.
        </p>

        {notice ? (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        {error ? (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {phase === "uid" || phase === "contact" ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm">
              <span className="font-medium text-zinc-800">표본 UID</span>
              <input
                type="text"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyUid();
                  }
                }}
                disabled={pending}
                placeholder="예: 1001"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2 disabled:opacity-60"
              />
            </label>
            <button
              type="button"
              disabled={pending || !uidInput.trim()}
              onClick={handleApplyUid}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applyPending ? "적용 중…" : "UID 적용"}
            </button>
          </div>
        ) : null}

        {applied && (phase === "contact" || phase === "survey") ? (
          <div className={`mt-4 rounded-xl border px-4 py-4 ${tone.border} ${tone.bg}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-600">
                  표본 v{applied.batchVersion} · UID {applied.uid}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-wide text-zinc-900">
                  {applied.phone}
                </p>
                <p className="mt-1 text-xs text-zinc-500">전화번호 — 직접 발신하세요</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>
                {applied.statusLabel}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-700">{applied.statusDescription}</p>

            {phase === "survey" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => setPhase("contact")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                컨택 결과 다시 선택
              </button>
            ) : null}
          </div>
        ) : null}

        {applied && phase === "contact" && applied.draft ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-sky-950">이어서 진행할 수 있습니다</p>
            <p className="mt-1 text-xs text-sky-900/85">
              이 표본은 이전에 설문 도중 저장된 진행 내역이 있습니다. 이어서 진행하면 저장된
              지점부터 계속할 수 있습니다.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={startResume}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              <Play className="h-4 w-4" aria-hidden />
              이어서 진행하기
            </button>
          </div>
        ) : null}

        {applied && phase === "contact" ? (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              <PhoneCall className="h-4 w-4 text-indigo-600" aria-hidden />
              컨택 결과 선택
            </p>
            {contactOptions.length === 0 ? (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                등록된 컨택 결과 선택지가 없습니다. 관리자에게 「전체 컨택 관리」 설정을 요청하세요.
              </p>
            ) : (
              <>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {contactOptions.map((option, index) => {
                    const selected = option.id === selectedOptionId;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={pending}
                        aria-pressed={selected}
                        onClick={() => setSelectedOptionId(option.id)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-60 ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/30"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-indigo-300 hover:bg-indigo-50/40"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${
                            selected
                              ? "bg-indigo-600 text-white"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">{option.label}</span>
                        {option.isSuccess ? (
                          <span className="flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            설문 진행
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-zinc-500">
                    {selectedOption
                      ? selectedOption.isSuccess
                        ? "선택 후 설문 문항으로 넘어갑니다."
                        : "선택한 결과가 표본에 기록되고 다음 표본으로 넘어갑니다."
                      : "결과를 하나 선택하세요."}
                  </p>
                  <button
                    type="button"
                    disabled={pending || !selectedOptionId}
                    onClick={handleConfirmOutcome}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {outcomePending
                      ? "저장 중…"
                      : selectedOption?.isSuccess
                        ? "설문 진행하기"
                        : "결과 저장"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>

      {phase === "survey" && applied ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">설문 진행 — UID {applied.uid}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            통화가 연결되었습니다. 아래 설문을 진행한 뒤 제출하면 응답이 이 표본에 연결됩니다.
            중간에 <strong>중도 중단</strong>하면 진행 내역이 저장됩니다.
          </p>
          <div className="mt-6">
            <SurveyResponseForm
              key={applied.id}
              survey={survey}
              isStaff
              sampleId={applied.id}
              catiMode
              viewMode={viewMode}
              initialAnswers={applied.draft?.answers}
              initialActiveQuestionId={applied.draft?.activeQuestionId ?? null}
              initialStartedAt={applied.draft?.startedAt ?? null}
              initialActiveSeconds={applied.draft?.activeSeconds ?? 0}
              onPause={handlePause}
              onCatiSubmitted={() => handleSurveySubmitted(applied.uid)}
            />
          </div>
        </section>
      ) : null}

      {phase === "done" ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-emerald-950">설문이 제출되었습니다</h3>
              <p className="mt-1 text-sm text-emerald-900/90">
                {doneUid ? `UID ${doneUid} ` : ""}응답이 저장되었습니다. 다음 작업을 선택하세요.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={resetWorkflow}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Play className="h-4 w-4" aria-hidden />
              이어서 진행하기
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              <Home className="h-4 w-4" aria-hidden />
              홈페이지로 돌아가기
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
