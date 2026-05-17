"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createSurveyAction } from "@/app/actions/create-survey";
import { updateSurveyAction } from "@/app/actions/update-survey";
import {
  createDraftQuestion,
  type CreateSurveyPayload,
  type DraftQuestion,
  type QuestionType,
} from "@/lib/survey-types";
import { QuestionAddPanel } from "@/components/admin/survey-builder/QuestionAddPanel";
import { QuestionEditCard } from "@/components/admin/survey-builder/QuestionEditCard";

type SurveyBuilderFormProps = {
  mode?: "create" | "edit";
  slug?: string;
  initial?: CreateSurveyPayload;
  responseCount?: number;
};

export function SurveyBuilderForm({
  mode = "create",
  slug,
  initial,
  responseCount = 0,
}: SurveyBuilderFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [periodLabel, setPeriodLabel] = useState(initial?.periodLabel ?? "");
  const [targetCount, setTargetCount] = useState(initial?.targetCount ?? 100);
  const [listedPublic, setListedPublic] = useState(initial?.listedPublic ?? true);
  const [status, setStatus] = useState<"예정" | "진행중" | "종료">(
    initial?.status ?? "진행중",
  );
  const [responseScript, setResponseScript] = useState(initial?.responseScript ?? "");
  const [questions, setQuestions] = useState<DraftQuestion[]>(initial?.questions ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      const copy = [...prev];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const addQuestionOfType = (type: QuestionType) => {
    setQuestions((prev) => [...prev, createDraftQuestion(type)]);
  };

  const buildPayload = (): CreateSurveyPayload => ({
    title,
    summary,
    periodLabel,
    targetCount: Number.isFinite(targetCount) ? Math.max(0, Math.floor(targetCount)) : 0,
    listedPublic,
    status,
    responseScript,
    questions: questions.map((q) => ({ ...q })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          설문 기본 정보
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {isEdit
            ? "기본 정보와 문항을 수정한 뒤 저장합니다."
            : "제목과 배포 설정을 먼저 정한 뒤, 아래「문항 추가」패널에서 유형별로 문항을 넣습니다."}
        </p>
        {isEdit && slug ? (
          <p className="mt-3 text-xs text-zinc-500">
            참여 URL slug:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-800">
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
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-zinc-800">제목 *</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              placeholder="예: 2026년 1분기 고객 만족도 조사"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-zinc-800">설명</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              placeholder="설문 목적·대상 등을 간단히 적어 주세요."
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">기간 표기</span>
            <input
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="예: 2026.04.01 — 2026.04.30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">목표 응답 수</span>
            <input
              type="number"
              min={0}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={listedPublic}
              onChange={(e) => setListedPublic(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
            />
            <span className="text-sm text-zinc-700">
              공개 사이트에 노출 (진행중·노출 설정일 때)
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-zinc-800">상태</span>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "예정" | "진행중" | "종료")
              }
              className="mt-1.5 w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="예정">예정</option>
              <option value="진행중">진행중</option>
              <option value="종료">종료</option>
            </select>
          </label>
        </div>
      </div>


      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          응답 스크립트 (직원용)
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          직원이 설문 입력·전화 조사 시 「스크립트 확인」 팝업에서 볼 내용입니다.
        </p>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-zinc-800">스크립트 본문</span>
          <textarea
            value={responseScript}
            onChange={(e) => setResponseScript(e.target.value)}
            rows={14}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 font-mono text-sm leading-relaxed outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            placeholder="전화 조사 시 직원이 읽을 스크립트를 입력하세요."
          />
        </label>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="order-2 min-w-0 space-y-4 lg:order-1">
          <div className="flex items-end justify-between gap-2 border-b border-zinc-200 pb-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">문항 목록</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                총 {questions.length}문항
              </p>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-16 text-center">
              <ClipboardList
                className="h-10 w-10 text-zinc-300"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-zinc-700">
                아직 문항이 없습니다
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                화면 상단(또는 오른쪽)의{" "}
                <strong className="font-medium text-zinc-700">문항 추가</strong> 패널에서
                유형을 누르면 여기에 편집 카드가 추가됩니다.
              </p>
            </div>
          ) : (
            questions.map((q, index) => (
              <QuestionEditCard
                key={q.clientId}
                q={q}
                index={index}
                total={questions.length}
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

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-8">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "저장 중…" : isEdit ? "변경 저장" : "설문 저장"}
        </button>
        <Link
          href="/admin/surveys"
          className="rounded-xl border border-zinc-200 bg-white px-8 py-3 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
