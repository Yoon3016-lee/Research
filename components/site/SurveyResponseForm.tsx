"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitSurveyResponseAction,
  type SubmitSurveyAfter,
} from "@/app/actions/submit-survey-response";
import type { PublicSurveyDetail, SurveyAnswerInput } from "@/lib/survey-public";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import { Likert7Input } from "@/components/site/Likert7Input";

type Props = {
  survey: PublicSurveyDetail;
};

function emptyTextMulti(lineCount: number): string[] {
  return Array.from({ length: lineCount }, () => "");
}

export function SurveyResponseForm({ survey }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [mcSingle, setMcSingle] = useState<Record<string, string>>({});
  const [mcMulti, setMcMulti] = useState<Record<string, string[]>>({});
  const [textSingle, setTextSingle] = useState<Record<string, string>>({});
  const [textMulti, setTextMulti] = useState<Record<string, string[]>>({});
  const [likert7, setLikert7] = useState<Record<string, number | null>>({});

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

  const setTextMultiLine = (
    questionId: string,
    index: number,
    value: string,
    lineCount: number,
  ) => {
    setTextMulti((prev) => {
      const lines = [...(prev[questionId] ?? emptyTextMulti(lineCount))];
      while (lines.length < lineCount) lines.push("");
      lines[index] = value;
      return { ...prev, [questionId]: lines };
    });
  };

  const buildAnswers = (): SurveyAnswerInput[] => {
    const out: SurveyAnswerInput[] = [];
    for (const q of survey.questions) {
      if (q.type === "mc_single") {
        out.push({ questionId: q.id, type: "mc_single", optionId: mcSingle[q.id] ?? "" });
      } else if (q.type === "mc_multi") {
        out.push({ questionId: q.id, type: "mc_multi", optionIds: mcMulti[q.id] ?? [] });
      } else if (q.type === "text_single") {
        out.push({ questionId: q.id, type: "text_single", text: textSingle[q.id] ?? "" });
      } else if (q.type === "text_multi") {
        const n = q.textLineCount ?? 2;
        const lines = textMulti[q.id] ?? emptyTextMulti(n);
        out.push({ questionId: q.id, type: "text_multi", lines });
      } else if (q.type === "likert_7") {
        const value = likert7[q.id];
        out.push({
          questionId: q.id,
          type: "likert_7",
          value: value ?? Number.NaN,
        });
      }
    }
    return out;
  };

  const resetForm = () => {
    setMcSingle({});
    setMcMulti({});
    setTextSingle({});
    setTextMulti({});
    setLikert7({});
  };

  const submit = (after: SubmitSurveyAfter) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await submitSurveyResponseAction(survey.slug, buildAnswers(), after);
      if (result.error) {
        setError(result.error);
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

  return (
    <div className="space-y-6">
      <ol className="space-y-6">
        {survey.questions.map((q, index) => (
          <li
            key={q.id}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-xs font-medium text-indigo-700">
                문항 {index + 1} · {QUESTION_TYPE_LABELS[q.type]}
              </p>
              {q.allowSkip ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  무응답 허용
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-base font-medium text-zinc-900">{q.prompt}</p>

            {(q.type === "mc_single" || q.type === "mc_multi") && (
              <ul className="mt-4 space-y-2">
                {q.options.map((opt) => {
                  const isMulti = q.type === "mc_multi";
                  const max = q.maxSelections ?? q.options.length;
                  const selected = isMulti
                    ? (mcMulti[q.id] ?? []).includes(opt.id)
                    : mcSingle[q.id] === opt.id;
                  return (
                    <li key={opt.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 transition hover:border-indigo-200 hover:bg-indigo-50/40 has-checked:border-indigo-300 has-checked:bg-indigo-50/60">
                        <input
                          type={isMulti ? "checkbox" : "radio"}
                          name={isMulti ? undefined : `q_${q.id}`}
                          checked={selected}
                          disabled={pending}
                          onChange={() => {
                            if (isMulti) {
                              toggleMulti(q.id, opt.id, max);
                            } else {
                              setMcSingle((prev) => ({ ...prev, [q.id]: opt.id }));
                            }
                          }}
                          className="mt-1 shrink-0"
                        />
                        <span className="text-sm text-zinc-800">{opt.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {q.type === "mc_multi" && q.maxSelections ? (
              <p className="mt-2 text-xs text-zinc-500">
                최대 {q.maxSelections}개까지 선택할 수 있습니다.
              </p>
            ) : null}

            {q.type === "text_single" && (
              <input
                type="text"
                value={textSingle[q.id] ?? ""}
                disabled={pending}
                onChange={(e) =>
                  setTextSingle((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                className="mt-4 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2 disabled:opacity-60"
                placeholder="답변을 입력하세요"
              />
            )}

            {q.type === "text_multi" && (
              <ul className="mt-4 space-y-2">
                {Array.from({ length: q.textLineCount ?? 2 }, (_, i) => (
                  <li key={i}>
                    <label className="sr-only">
                      {q.prompt} — 답변 {i + 1}
                    </label>
                    <input
                      type="text"
                      value={(textMulti[q.id] ?? [])[i] ?? ""}
                      disabled={pending}
                      onChange={(e) =>
                        setTextMultiLine(q.id, i, e.target.value, q.textLineCount ?? 2)
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2 disabled:opacity-60"
                      placeholder={`답변 ${i + 1}`}
                    />
                  </li>
                ))}
              </ul>
            )}

            {q.type === "likert_7" && (
              <Likert7Input
                questionId={q.id}
                prompt={q.prompt}
                options={q.options}
                value={likert7[q.id] ?? null}
                disabled={pending}
                onChange={(value) =>
                  setLikert7((prev) => ({ ...prev, [q.id]: value }))
                }
              />
            )}
          </li>
        ))}
      </ol>

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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
      </div>
    </div>
  );
}
