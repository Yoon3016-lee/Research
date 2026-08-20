"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, PauseCircle } from "lucide-react";
import {
  submitSurveyResponseAction,
  type SubmitSurveyAfter,
} from "@/app/actions/submit-survey-response";
import { rememberCatiStartedAtAction } from "@/app/actions/cati-drafts";
import { SurveyQuestionField } from "@/components/site/SurveyQuestionField";
import { ProgressGradientBar } from "@/components/admin/ProgressGradientBar";
import type {
  PublicSurveyDetail,
  PublicSurveyQuestion,
  SurveyAnswerInput,
} from "@/lib/survey-public";
import { clampLikertScaleSize } from "@/lib/likert-scale";
import {
  likertMultiValuesFromRecord,
} from "@/components/site/LikertMultiInput";
import {
  branchingSnapshotFromFormState,
  buildParticipantDisplayNumbers,
  isEndsSurveyOptionSelected,
  isQuestionShownInSurvey,
} from "@/lib/survey-visibility";
import {
  validateSurveyAnswers,
  validateSurveyQuestionAnswer,
} from "@/lib/survey-validate-answers";
import type { SurveyViewMode } from "@/lib/survey-view-mode";
import {
  clearSurveyStartedAt,
  persistSurveyTimer,
  readOrCreateSurveyTimer,
  surveyStartedAtStorageKey,
} from "@/lib/survey-duration";

export type SurveyPausePayload = {
  answers: SurveyAnswerInput[];
  activeQuestionId: string | null;
  startedAt: string;
  activeSeconds: number;
};

type Props = {
  survey: PublicSurveyDetail;
  isStaff: boolean;
  sampleId?: string;
  catiMode?: boolean;
  emailMode?: boolean;
  inviteToken?: string;
  viewMode?: SurveyViewMode;
  onCatiSubmitted?: () => void;
  initialAnswers?: SurveyAnswerInput[];
  initialActiveQuestionId?: string | null;
  initialStartedAt?: string | null;
  initialActiveSeconds?: number | null;
  onPause?: (payload: SurveyPausePayload) => Promise<{ ok: boolean; error?: string }>;
};

type HydratedState = {
  mcSingle: Record<string, string>;
  mcMulti: Record<string, string[]>;
  mcOtherText: Record<string, string>;
  textSingle: Record<string, string>;
  textMulti: Record<string, Record<string, string>>;
  likert7: Record<string, number | null>;
  dropdown: Record<string, string>;
  rank: Record<string, string[]>;
  likertMulti: Record<string, Record<string, number | null>>;
  starRating: Record<string, number | null>;
  contactFields: Record<string, Record<string, string>>;
};

function hydrateState(answers: SurveyAnswerInput[] | undefined): HydratedState {
  const state: HydratedState = {
    mcSingle: {},
    mcMulti: {},
    mcOtherText: {},
    textSingle: {},
    textMulti: {},
    likert7: {},
    dropdown: {},
    rank: {},
    likertMulti: {},
    starRating: {},
    contactFields: {},
  };
  for (const a of answers ?? []) {
    if (a.type === "mc_single") {
      state.mcSingle[a.questionId] = a.optionId;
      if (a.otherText) state.mcOtherText[a.questionId] = a.otherText;
    } else if (a.type === "mc_multi") {
      state.mcMulti[a.questionId] = a.optionIds;
      if (a.otherText) state.mcOtherText[a.questionId] = a.otherText;
    } else if (a.type === "text_single") {
      state.textSingle[a.questionId] = a.text;
    } else if (a.type === "text_multi") {
      if (a.values && typeof a.values === "object") {
        state.textMulti[a.questionId] = { ...a.values };
      } else if (Array.isArray(a.lines)) {
        // 구 초안: 줄 배열 → 임시 키 (표시 시 문항 options와 재매핑은 생략)
        const mapped: Record<string, string> = {};
        a.lines.forEach((line, i) => {
          mapped[`legacy_${i}`] = line;
        });
        state.textMulti[a.questionId] = mapped;
      }
    } else if (a.type === "likert_7") {
      state.likert7[a.questionId] = Number.isNaN(a.value) ? null : a.value;
    } else if (a.type === "dropdown") {
      state.dropdown[a.questionId] = a.optionId;
    } else if (a.type === "rank") {
      state.rank[a.questionId] = a.rankedOptionIds;
    } else if (a.type === "likert_multi") {
      const rec: Record<string, number | null> = {};
      for (const [k, v] of Object.entries(a.values)) rec[k] = v;
      state.likertMulti[a.questionId] = rec;
    } else if (a.type === "star_rating") {
      state.starRating[a.questionId] = Number.isNaN(a.value) ? null : a.value;
    } else if (a.type === "contact_fields") {
      state.contactFields[a.questionId] = { ...a.values };
    }
  }
  return state;
}

export function SurveyResponseForm({
  survey,
  isStaff,
  sampleId,
  catiMode = false,
  emailMode = false,
  inviteToken,
  viewMode = "paged",
  onCatiSubmitted,
  initialAnswers,
  initialActiveQuestionId,
  initialStartedAt,
  initialActiveSeconds,
  onPause,
}: Props) {
  const isScroll = viewMode === "scroll";
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialState] = useState<HydratedState>(() => hydrateState(initialAnswers));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pausePending, startPause] = useTransition();
  const startedAtStorageKey = surveyStartedAtStorageKey(
    survey.slug,
    sampleId || inviteToken || (emailMode ? "email" : catiMode ? "cati" : "public"),
  );
  const persistStartedAt = Boolean(sampleId || inviteToken || catiMode);
  const [timer] = useState(() =>
    readOrCreateSurveyTimer(startedAtStorageKey, {
      persistent: persistStartedAt,
      seedStartedAt: initialStartedAt,
      seedActiveSeconds: initialActiveSeconds,
    }),
  );
  const startedAt = timer.startedAt;
  const accumulatedRef = useRef(timer.activeSeconds);
  const segmentStartRef = useRef<number | null>(null);

  const flushOpenTimer = () => {
    if (segmentStartRef.current != null) {
      accumulatedRef.current += (Date.now() - segmentStartRef.current) / 1000;
      segmentStartRef.current = null;
    }
    const activeSeconds = Math.max(0, Math.round(accumulatedRef.current));
    persistSurveyTimer(
      startedAtStorageKey,
      { startedAt, activeSeconds },
      persistStartedAt,
    );
    return activeSeconds;
  };

  const resumeOpenTimer = () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (segmentStartRef.current == null) {
      segmentStartRef.current = Date.now();
    }
  };

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    initialActiveQuestionId ?? null,
  );

  useEffect(() => {
    resumeOpenTimer();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushOpenTimer();
      else resumeOpenTimer();
    };
    const onPageHide = () => {
      flushOpenTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    const interval = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const extra =
        segmentStartRef.current != null ? (Date.now() - segmentStartRef.current) / 1000 : 0;
      persistSurveyTimer(
        startedAtStorageKey,
        { startedAt, activeSeconds: Math.max(0, Math.round(accumulatedRef.current + extra)) },
        persistStartedAt,
      );
    }, 5000);
    return () => {
      flushOpenTimer();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(interval);
    };
    // 설문 세션당 한 번만 타이머를 겁니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!catiMode || !sampleId || !startedAt) return;
    void rememberCatiStartedAtAction(
      survey.slug,
      sampleId,
      startedAt,
      Math.max(0, Math.round(accumulatedRef.current)),
    );
  }, [catiMode, sampleId, startedAt, survey.slug]);

  const [mcSingle, setMcSingle] = useState<Record<string, string>>(initialState.mcSingle);
  const [mcMulti, setMcMulti] = useState<Record<string, string[]>>(initialState.mcMulti);
  const [mcOtherText, setMcOtherText] = useState<Record<string, string>>(
    initialState.mcOtherText,
  );
  const [textSingle, setTextSingle] = useState<Record<string, string>>(initialState.textSingle);
  const [textMulti, setTextMulti] = useState<Record<string, Record<string, string>>>(
    initialState.textMulti,
  );
  const [likert7, setLikert7] = useState<Record<string, number | null>>(initialState.likert7);
  const [dropdown, setDropdown] = useState<Record<string, string>>(initialState.dropdown);
  const [rank, setRank] = useState<Record<string, string[]>>(initialState.rank);
  const [likertMulti, setLikertMulti] = useState<Record<string, Record<string, number | null>>>(
    initialState.likertMulti,
  );
  const [starRating, setStarRating] = useState<Record<string, number | null>>(
    initialState.starRating,
  );
  const [contactFields, setContactFields] = useState<Record<string, Record<string, string>>>(
    initialState.contactFields,
  );

  const branchingSnapshot = useMemo(
    () => branchingSnapshotFromFormState(mcSingle, dropdown),
    [mcSingle, dropdown],
  );

  const visibleQuestions = useMemo(
    () =>
      survey.questions.filter((q) =>
        isQuestionShownInSurvey(q, survey.questions, branchingSnapshot, isStaff),
      ),
    [survey.questions, branchingSnapshot, isStaff],
  );

  const surveyEndedByOption = useMemo(() => {
    for (const q of visibleQuestions) {
      if (isEndsSurveyOptionSelected(q, branchingSnapshot)) return true;
    }
    return false;
  }, [visibleQuestions, branchingSnapshot]);

  const visibleQuestionIds = useMemo(
    () => new Set(visibleQuestions.map((q) => q.id)),
    [visibleQuestions],
  );

  const displayNumberByQuestionId = useMemo(
    () => buildParticipantDisplayNumbers(survey.questions, branchingSnapshot, isStaff),
    [survey.questions, branchingSnapshot, isStaff],
  );

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      setActiveQuestionId(null);
      return;
    }
    setActiveQuestionId((current) => {
      if (current && visibleQuestions.some((q) => q.id === current)) {
        return current;
      }
      return visibleQuestions[0].id;
    });
  }, [visibleQuestions]);

  useEffect(() => {
    const keep = (id: string) => visibleQuestionIds.has(id);
    setMcSingle((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setMcMulti((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setTextSingle((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setTextMulti((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setLikert7((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setDropdown((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setRank((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setLikertMulti((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setStarRating((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setMcOtherText((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
    setContactFields((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => keep(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [visibleQuestionIds]);

  const stepIndex = activeQuestionId
    ? visibleQuestions.findIndex((q) => q.id === activeQuestionId)
    : 0;
  const currentQuestion =
    stepIndex >= 0 ? visibleQuestions[stepIndex] : visibleQuestions[0] ?? null;
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= visibleQuestions.length - 1;

  const fieldState = {
    mcSingle,
    mcMulti,
    mcOtherText,
    textSingle,
    textMulti,
    likert7,
    dropdown,
    rank,
    likertMulti,
    starRating,
    contactFields,
  };

  const toggleMulti = (questionId: string, optionId: string, max: number) => {
    setMcMulti((prev) => {
      const current = prev[questionId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= max) return prev;
      return { ...prev, [questionId]: [...current, optionId] };
    });
  };

  const setTextMultiField = (questionId: string, optionId: string, value: string) => {
    setTextMulti((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), [optionId]: value },
    }));
  };

  const buildAnswers = (): SurveyAnswerInput[] => {
    const out: SurveyAnswerInput[] = [];
    for (const q of survey.questions) {
      if (!visibleQuestionIds.has(q.id)) continue;
      if (q.type === "mc_single") {
        const optionId = mcSingle[q.id] ?? "";
        const otherOpt = q.options.find((o) => o.isOther);
        const otherSelected = Boolean(otherOpt && optionId === otherOpt.id);
        out.push({
          questionId: q.id,
          type: "mc_single",
          optionId,
          ...(otherSelected ? { otherText: mcOtherText[q.id] ?? "" } : {}),
        });
      } else if (q.type === "mc_multi") {
        const optionIds = mcMulti[q.id] ?? [];
        const otherOpt = q.options.find((o) => o.isOther);
        const otherSelected = Boolean(otherOpt && optionIds.includes(otherOpt.id));
        out.push({
          questionId: q.id,
          type: "mc_multi",
          optionIds,
          ...(otherSelected ? { otherText: mcOtherText[q.id] ?? "" } : {}),
        });
      } else if (q.type === "text_single") {
        out.push({ questionId: q.id, type: "text_single", text: textSingle[q.id] ?? "" });
      } else if (q.type === "text_multi") {
        out.push({
          questionId: q.id,
          type: "text_multi",
          values: textMulti[q.id] ?? {},
        });
      } else if (q.type === "likert_7") {
        const value = likert7[q.id];
        out.push({
          questionId: q.id,
          type: "likert_7",
          value: value ?? Number.NaN,
        });
      } else if (q.type === "dropdown") {
        out.push({ questionId: q.id, type: "dropdown", optionId: dropdown[q.id] ?? "" });
      } else if (q.type === "rank") {
        out.push({
          questionId: q.id,
          type: "rank",
          rankedOptionIds: rank[q.id] ?? [],
        });
      } else if (q.type === "likert_multi") {
        out.push({
          questionId: q.id,
          type: "likert_multi",
          values: likertMultiValuesFromRecord(
            likertMulti[q.id] ?? {},
            clampLikertScaleSize(q.maxSelections),
          ),
        });
      } else if (q.type === "star_rating") {
        const value = starRating[q.id];
        out.push({
          questionId: q.id,
          type: "star_rating",
          value: value ?? Number.NaN,
        });
      } else if (q.type === "contact_fields") {
        out.push({
          questionId: q.id,
          type: "contact_fields",
          values: contactFields[q.id] ?? {},
        });
      }
      // info_media: 답변 없음
    }
    return out;
  };

  const resetForm = () => {
    setMcSingle({});
    setMcMulti({});
    setMcOtherText({});
    setTextSingle({});
    setTextMulti({});
    setLikert7({});
    setDropdown({});
    setRank({});
    setLikertMulti({});
    setStarRating({});
    setContactFields({});
    setActiveQuestionId(visibleQuestions[0]?.id ?? null);
  };

  const scrollToActiveQuestion = () => {
    const el = containerRef.current;
    if (!el) return;
    const offset = 16;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  };

  const goPrev = () => {
    setError(null);
    const prev = visibleQuestions[stepIndex - 1];
    if (prev) {
      setActiveQuestionId(prev.id);
      scrollToActiveQuestion();
    }
  };

  const goNext = () => {
    if (!currentQuestion) return;
    const answers = buildAnswers();
    const validationError = validateSurveyQuestionAnswer(
      survey,
      currentQuestion.id,
      answers,
      isStaff,
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const next = visibleQuestions[stepIndex + 1];
    if (next) {
      setActiveQuestionId(next.id);
      scrollToActiveQuestion();
    }
  };

  const pause = () => {
    if (!onPause) return;
    setError(null);
    setSuccess(null);
    startPause(async () => {
      const result = await onPause({
        answers: buildAnswers(),
        activeQuestionId,
        startedAt,
        activeSeconds: flushOpenTimer(),
      });
      if (!result.ok) {
        setError(result.error ?? "진행 내역 저장에 실패했습니다.");
        resumeOpenTimer();
      }
    });
  };

  const submit = (after: SubmitSurveyAfter) => {
    setSuccess(null);
    const answers = buildAnswers();
    const validationError = validateSurveyAnswers(survey, answers, isStaff);
    if (validationError) {
      setError(validationError);
      scrollToActiveQuestion();
      return;
    }

    if (emailMode) {
      const ok = confirm(
        "제출 후에는 응답을 수정할 수 없으며, 이 링크로 다시 접속할 수 없습니다.\n\n정말 제출하시겠습니까?",
      );
      if (!ok) return;
    }

    setError(null);
    startTransition(async () => {
      const submitAfter = catiMode ? "stay" : after;
      const result = await submitSurveyResponseAction(survey.slug, answers, submitAfter, {
        sampleId,
        inviteToken,
        startedAt,
        activeSeconds: flushOpenTimer(),
      });
      if (result.error) {
        setError(result.error);
        resumeOpenTimer();
        return;
      }
      clearSurveyStartedAt(startedAtStorageKey, { persistent: persistStartedAt });
      if (catiMode) {
        onCatiSubmitted?.();
        return;
      }
      if (result.ok && (result.after === "thanks" || emailMode)) {
        router.push(`/survey/${survey.slug}/thanks?email=1`);
        return;
      }
      if (after === "list") {
        router.push("/surveys");
        router.refresh();
        return;
      }
      resetForm();
      setSuccess("응답이 제출되었습니다. 같은 설문에 이어서 다시 응답할 수 있습니다.");
      router.refresh();
    });
  };

  if (visibleQuestions.length === 0) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        현재 표시할 문항이 없습니다. 직원 전용 문항만 있는 설문은 직원 로그인이 필요합니다.
      </p>
    );
  }

  const answerableCount = visibleQuestions.filter(
    (q) => q.type !== "info_media",
  ).length;

  const renderQuestion = (q: PublicSurveyQuestion, displayNumber: number | null) => (
    <SurveyQuestionField
      key={q.id}
      question={q}
      displayNumber={displayNumber}
      state={fieldState}
      pending={pending || pausePending}
      onMcSingle={(questionId, optionId) =>
        setMcSingle((prev) => ({ ...prev, [questionId]: optionId }))
      }
      onMcMultiToggle={toggleMulti}
      onMcOtherText={(questionId, value) =>
        setMcOtherText((prev) => ({ ...prev, [questionId]: value }))
      }
      onTextSingle={(questionId, value) =>
        setTextSingle((prev) => ({ ...prev, [questionId]: value }))
      }
      onTextMultiField={setTextMultiField}
      onLikert7={(questionId, value) =>
        setLikert7((prev) => ({ ...prev, [questionId]: value }))
      }
      onDropdown={(questionId, optionId) =>
        setDropdown((prev) => ({ ...prev, [questionId]: optionId }))
      }
      onRank={(questionId, rankedOptionIds) =>
        setRank((prev) => ({ ...prev, [questionId]: rankedOptionIds }))
      }
      onLikertMulti={(questionId, optionId, value) =>
        setLikertMulti((prev) => ({
          ...prev,
          [questionId]: { ...(prev[questionId] ?? {}), [optionId]: value },
        }))
      }
      onStarRating={(questionId, value) =>
        setStarRating((prev) => ({ ...prev, [questionId]: value }))
      }
      onContactField={(questionId, optionId, value) =>
        setContactFields((prev) => ({
          ...prev,
          [questionId]: { ...(prev[questionId] ?? {}), [optionId]: value },
        }))
      }
    />
  );

  const pauseButton = onPause ? (
    <button
      type="button"
      disabled={pending || pausePending}
      onClick={pause}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 shadow-sm hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <PauseCircle className="h-4 w-4" aria-hidden />
      {pausePending ? "저장 중…" : "중도 중단"}
    </button>
  ) : null;

  const submitButtons = catiMode ? (
    <button
      type="button"
      disabled={pending || pausePending}
      onClick={() => submit("stay")}
      className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
    >
      {pending ? "제출 중…" : "제출하기"}
    </button>
  ) : emailMode ? (
    <button
      type="button"
      disabled={pending}
      onClick={() => submit("thanks")}
      className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
    >
      {pending ? "제출 중…" : "제출하기"}
    </button>
  ) : (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => submit("stay")}
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "제출 중…" : "설문 제출 — 계속 작업"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => submit("list")}
        className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
      >
        {pending ? "제출 중…" : "설문 제출 — 설문 목록 돌아가기"}
      </button>
    </>
  );

  const feedback = (
    <>
      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          {success}
        </p>
      ) : null}
      {surveyEndedByOption && !success ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          선택하신 보기로 조사가 종료됩니다. 아래 제출 버튼을 눌러 주세요.
        </p>
      ) : null}
    </>
  );

  if (isScroll) {
    return (
      <div ref={containerRef} className="scroll-mt-4 space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs font-medium text-zinc-600">
          전체 {answerableCount}문항
          {visibleQuestions.length > answerableCount
            ? ` · 안내 ${visibleQuestions.length - answerableCount}`
            : ""}{" "}
          · 스크롤하며 응답한 뒤 제출하세요.
        </div>

        <div className="space-y-4">
          {visibleQuestions.map((q) =>
            renderQuestion(q, displayNumberByQuestionId.get(q.id) ?? null),
          )}
        </div>

        {feedback}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {pauseButton}
          {submitButtons}
        </div>
      </div>
    );
  }

  const progressPercent =
    visibleQuestions.length > 0
      ? Math.round(((stepIndex + 1) / visibleQuestions.length) * 100)
      : 0;

  return (
    <div ref={containerRef} className="scroll-mt-4 space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-600">
          <span>
            {currentQuestion?.type === "info_media"
              ? `안내 · ${stepIndex + 1} / ${visibleQuestions.length}`
              : `${stepIndex + 1} / ${visibleQuestions.length}`}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <ProgressGradientBar
          percent={progressPercent}
          label={`설문 진행률 ${progressPercent}% (${stepIndex + 1}/${visibleQuestions.length})`}
          className="mt-2"
          trackClassName="bg-zinc-200"
          tone="completed"
        />
      </div>

      {currentQuestion
        ? renderQuestion(
            currentQuestion,
            displayNumberByQuestionId.get(currentQuestion.id) ?? null,
          )
        : null}

      {feedback}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={pending || pausePending || isFirst}
          onClick={goPrev}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          이전
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {pauseButton}
          {!isLast ? (
            <button
              type="button"
              disabled={pending || pausePending}
              onClick={goNext}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              다음
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            submitButtons
          )}
        </div>
      </div>
    </div>
  );
}
