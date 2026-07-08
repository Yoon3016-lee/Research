"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createSurveyAction } from "@/app/actions/create-survey";
import { updateSurveyAction } from "@/app/actions/update-survey";
import {
  addDaysToDateOnly,
  resolveSurveyStatus,
  toDateOnlyString,
  validateSurveyPeriod,
} from "@/lib/survey-period";
import type { SurveyStatus } from "@/lib/survey-list-types";
import {
  createDraftQuestion,
  type CreateSurveyPayload,
  type DraftQuestion,
  type QuestionType,
} from "@/lib/survey-types";
import { SurveyTemplateImportButton } from "@/components/admin/SurveyTemplateImportButton";
import type { SurveyTemplatePickerSurvey } from "@/components/admin/SurveyTemplatePicker";
import { QuestionAddPanel } from "@/components/admin/survey-builder/QuestionAddPanel";
import { QuestionEditCard } from "@/components/admin/survey-builder/QuestionEditCard";
import { remapRulesAfterRemove, remapRulesAfterSwap } from "@/lib/survey-visibility";

export type SurveyTemplateFrom = {
  sourceTitle: string;
  sourceSlug: string;
  questions: DraftQuestion[];
};

type SurveyBuilderFormProps = {
  mode?: "create" | "edit";
  slug?: string;
  initial?: CreateSurveyPayload;
  responseCount?: number;
  /** URL ?template= 또는 서버에서 미리 로드한 문항 */
  templateFrom?: SurveyTemplateFrom;
  /** 템플릿 선택 모달용 설문 목록 */
  templateSurveys?: SurveyTemplatePickerSurvey[];
};

export function SurveyBuilderForm({
  mode = "create",
  slug,
  initial,
  responseCount = 0,
  templateFrom,
  templateSurveys = [],
}: SurveyBuilderFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const today = toDateOnlyString();
  const defaultEnd = addDaysToDateOnly(today, 30);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [periodStart, setPeriodStart] = useState(
    initial?.periodStart?.trim() || (isEdit ? "" : today),
  );
  const [periodEnd, setPeriodEnd] = useState(
    initial?.periodEnd?.trim() || (isEdit ? "" : defaultEnd),
  );
  const [targetCount, setTargetCount] = useState(initial?.targetCount ?? 100);
  const [listedPublic, setListedPublic] = useState(initial?.listedPublic ?? true);
  const [responseScript, setResponseScript] = useState(initial?.responseScript ?? "");
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    templateFrom?.questions ?? initial?.questions ?? [],
  );
  const [templateSource, setTemplateSource] = useState<{
    title: string;
    slug: string;
  } | null>(
    templateFrom
      ? { title: templateFrom.sourceTitle, slug: templateFrom.sourceSlug }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const applyTemplate = (payload: {
    questions: DraftQuestion[];
    sourceTitle: string;
    sourceSlug: string;
  }) => {
    const replace = () => {
      setQuestions(payload.questions);
      setTemplateSource({ title: payload.sourceTitle, slug: payload.sourceSlug });
      setError(null);
    };

    if (questions.length > 0) {
      const ok = confirm(
        `현재 문항 ${questions.length}개를 「${payload.sourceTitle}」 설문의 문항 ${payload.questions.length}개로 바꿀까요?`,
      );
      if (!ok) return;
    }
    replace();
  };

  const autoStatus: SurveyStatus | null = useMemo(() => {
    if (validateSurveyPeriod(periodStart, periodEnd)) return null;
    return resolveSurveyStatus(periodStart, periodEnd);
  }, [periodStart, periodEnd]);

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      return remapRulesAfterSwap(prev, index, j);
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => remapRulesAfterRemove(prev, index));
  };

  const addQuestionOfType = (type: QuestionType) => {
    setQuestions((prev) => [...prev, createDraftQuestion(type)]);
  };

  const buildPayload = (): CreateSurveyPayload => ({
    title,
    summary,
    periodStart,
    periodEnd,
    targetCount: Number.isFinite(targetCount) ? Math.max(0, Math.floor(targetCount)) : 0,
    listedPublic,
    responseScript,
    questions: questions.map((q) => ({ ...q })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const periodErr = validateSurveyPeriod(periodStart, periodEnd);
    if (periodErr) {
      setError(periodErr);
      return;
    }
    if (questions.length === 0) {
      setError(
        "문항을 하나 이상 추가해 주세요.「문항 추가」패널에서 유형을 선택하세요.",
      );
      return;
    }
    startTransition(async () => {
      const payload = buildPayload();
      const res = isEdit
        ? await updateSurveyAction(slug ?? "", payload)
        : await createSurveyAction(payload);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      if ("ok" in res && res.ok) {
        const query = isEdit ? "updated" : "created";
        router.push(`/admin/surveys?${query}=${encodeURIComponent(res.slug)}`);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-8 pb-20">
      <div className="admin-card p-6">
        <h2 className="text-base font-semibold tracking-tight text-brand-900">
          설문 기본 정보
        </h2>
        <p className="mt-1 text-sm text-brand-700/80">
          {isEdit
            ? "기본 정보와 문항을 수정한 뒤 저장합니다."
            : "제목과 배포 설정을 먼저 정한 뒤, 아래「문항 추가」패널에서 유형별로 문항을 넣습니다."}
        </p>
        {isEdit && slug ? (
          <p className="mt-3 text-xs text-brand-700/80">
            참여 URL slug:{" "}
            <code className="rounded bg-brand-900/6 px-1.5 py-0.5 font-mono text-brand-900">
              {slug}
            </code>
          </p>
        ) : null}
        {isEdit && responseCount > 0 ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            이 설문에 응답이 {responseCount.toLocaleString()}건 있습니다. 문항 구조를
            바꾸면 기존 응답에 연결된 문항·선택지 데이터가 삭제될 수 있습니다.
          </p>
        ) : null}
        {templateSource ? (
          <p className="mt-3 rounded-lg border border-accent-500/25 bg-accent-500/10 px-3 py-2 text-xs text-brand-900">
            템플릿: 「{templateSource.title}」({templateSource.slug})에서 문항{" "}
            {questions.length}개를 불러왔습니다. 제목·기간 등은 새로 입력·저장됩니다.
          </p>
        ) : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="admin-label">제목 *</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="admin-input mt-1.5"
              placeholder="예: 2026년 1분기 고객 만족도 조사"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="admin-label">설명</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="admin-input mt-1.5"
              placeholder="설문 목적·대상 등을 간단히 적어 주세요."
            />
          </label>
          <label className="block">
            <span className="admin-label">시작일 *</span>
            <input
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="admin-input mt-1.5"
            />
          </label>
          <label className="block">
            <span className="admin-label">종료일 *</span>
            <input
              type="date"
              required
              value={periodEnd}
              min={periodStart || undefined}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="admin-input mt-1.5"
            />
          </label>
          <div className="block sm:col-span-2">
            <span className="admin-label">설문 상태</span>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-brand-700">
              {autoStatus ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    autoStatus === "진행중"
                      ? "bg-emerald-100 text-emerald-900"
                      : autoStatus === "예정"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-brand-900/10 text-brand-800"
                  }`}
                >
                  {autoStatus}
                </span>
              ) : (
                <span className="text-brand-700/80">날짜를 선택하면 자동으로 표시됩니다.</span>
              )}
              <span className="text-xs text-brand-700/80">
                오늘 날짜와 시작·종료일을 비교해 예정 / 진행중 / 종료로 설정됩니다.
              </span>
            </p>
          </div>
          <label className="block">
            <span className="admin-label">목표 응답 수</span>
            <input
              type="number"
              min={0}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="admin-input mt-1.5"
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={listedPublic}
              onChange={(e) => setListedPublic(e.target.checked)}
              className="h-4 w-4 rounded border-brand-900/20 text-accent-600"
            />
            <span className="text-sm text-brand-800">
              공개 사이트 목록에 표시 (진행중·예정). 참여는 진행중일 때만 가능
            </span>
          </label>
        </div>
      </div>


      <div className="admin-card p-6">
        <h2 className="text-base font-semibold tracking-tight text-brand-900">
          응답 스크립트 (직원용)
        </h2>
        <p className="mt-1 text-sm text-brand-700/80">
          직원이 설문 입력·전화 조사 시 「스크립트 확인」 팝업에서 볼 내용입니다.
        </p>
        <label className="mt-5 block">
          <span className="admin-label">스크립트 본문</span>
          <textarea
            value={responseScript}
            onChange={(e) => setResponseScript(e.target.value)}
            rows={14}
            className="admin-input mt-1.5 font-mono leading-relaxed"
            placeholder="전화 조사 시 직원이 읽을 스크립트를 입력하세요."
          />
        </label>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="order-2 min-w-0 space-y-4 lg:order-1">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-brand-900/8 pb-2">
            <div>
              <h2 className="text-base font-semibold text-brand-900">문항 목록</h2>
              <p className="mt-0.5 text-xs text-brand-700/80">
                총 {questions.length}문항
              </p>
            </div>
            {templateSurveys.length > 0 ? (
              <SurveyTemplateImportButton
                surveys={templateSurveys}
                excludeSlug={isEdit ? slug : undefined}
                mode="apply"
                onApply={applyTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-brand-900 hover:bg-accent-500/18"
                label="다른 설문에서 문항 가져오기"
              />
            ) : null}
          </div>

          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-900/12 bg-surface/60 px-6 py-16 text-center">
              <ClipboardList
                className="h-10 w-10 text-brand-700/30"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-brand-800">
                아직 문항이 없습니다
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-700/80">
                <strong className="font-medium text-brand-900">문항 추가</strong> 패널에서
                유형을 선택하거나,{" "}
                <strong className="font-medium text-brand-900">다른 설문에서 문항 가져오기</strong>
                로 기존 설문 문항을 복사할 수 있습니다.
              </p>
            </div>
          ) : (
            questions.map((q, index) => (
              <QuestionEditCard
                key={q.clientId}
                q={q}
                index={index}
                total={questions.length}
                allQuestions={questions}
                onChange={(patch) => updateQuestion(index, patch)}
                onMove={(dir) => moveQuestion(index, dir)}
                onRemove={() => removeQuestion(index)}
              />
            ))
          )}
        </div>

        <aside className="order-1 lg:sticky lg:top-20 lg:order-2 lg:self-start">
          <QuestionAddPanel onAdd={addQuestionOfType} disabled={pending} />
        </aside>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-brand-900/8 pt-8">
        <button
          type="submit"
          disabled={pending}
          className="admin-btn-primary px-8 py-3"
        >
          {pending ? "저장 중…" : isEdit ? "변경 저장" : "설문 저장"}
        </button>
        <Link
          href="/admin/surveys"
          className="admin-btn-secondary px-8 py-3"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
