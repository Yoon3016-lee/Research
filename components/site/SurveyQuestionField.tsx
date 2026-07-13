"use client";

import type { PublicSurveyQuestion } from "@/lib/survey-public";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import { Likert7Input } from "@/components/site/Likert7Input";
import { LikertMultiInput } from "@/components/site/LikertMultiInput";
import { RankSelectInput } from "@/components/site/RankSelectInput";
import { StarRatingInput } from "@/components/site/StarRatingInput";

export type SurveyQuestionFieldState = {
  mcSingle: Record<string, string>;
  mcMulti: Record<string, string[]>;
  textSingle: Record<string, string>;
  textMulti: Record<string, string[]>;
  likert7: Record<string, number | null>;
  dropdown: Record<string, string>;
  rank: Record<string, string[]>;
  likertMulti: Record<string, Record<string, number | null>>;
  starRating: Record<string, number | null>;
};

type Props = {
  question: PublicSurveyQuestion;
  displayNumber: number;
  state: SurveyQuestionFieldState;
  pending: boolean;
  onMcSingle: (questionId: string, optionId: string) => void;
  onMcMultiToggle: (questionId: string, optionId: string, max: number) => void;
  onTextSingle: (questionId: string, value: string) => void;
  onTextMultiLine: (questionId: string, index: number, value: string, lineCount: number) => void;
  onLikert7: (questionId: string, value: number | null) => void;
  onDropdown: (questionId: string, optionId: string) => void;
  onRank: (questionId: string, rankedOptionIds: string[]) => void;
  onLikertMulti: (questionId: string, optionId: string, value: number | null) => void;
  onStarRating: (questionId: string, value: number | null) => void;
};

function emptyTextMulti(lineCount: number): string[] {
  return Array.from({ length: lineCount }, () => "");
}

export function SurveyQuestionField({
  question: q,
  displayNumber,
  state,
  pending,
  onMcSingle,
  onMcMultiToggle,
  onTextSingle,
  onTextMultiLine,
  onLikert7,
  onDropdown,
  onRank,
  onLikertMulti,
  onStarRating,
}: Props) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-medium text-indigo-700">
          문항 {displayNumber} · {QUESTION_TYPE_LABELS[q.type]}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {q.staffOnly ? (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
              직원 전용
            </span>
          ) : null}
          {q.allowSkip ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              무응답 허용
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-base font-medium text-zinc-900">{q.prompt}</p>

      {(q.type === "mc_single" || q.type === "mc_multi") && (
        <ul className="mt-4 space-y-2">
          {q.options.map((opt) => {
            const isMulti = q.type === "mc_multi";
            const max = q.maxSelections ?? q.options.length;
            const selected = isMulti
              ? (state.mcMulti[q.id] ?? []).includes(opt.id)
              : state.mcSingle[q.id] === opt.id;
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
                        onMcMultiToggle(q.id, opt.id, max);
                      } else {
                        onMcSingle(q.id, opt.id);
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
          value={state.textSingle[q.id] ?? ""}
          disabled={pending}
          onChange={(e) => onTextSingle(q.id, e.target.value)}
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
                value={(state.textMulti[q.id] ?? emptyTextMulti(q.textLineCount ?? 2))[i] ?? ""}
                disabled={pending}
                onChange={(e) =>
                  onTextMultiLine(q.id, i, e.target.value, q.textLineCount ?? 2)
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
          value={state.likert7[q.id] ?? null}
          disabled={pending}
          onChange={(value) => onLikert7(q.id, value)}
        />
      )}

      {q.type === "dropdown" && (
        <select
          value={state.dropdown[q.id] ?? ""}
          disabled={pending}
          onChange={(e) => onDropdown(q.id, e.target.value)}
          className="mt-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2 disabled:opacity-60"
        >
          <option value="">선택하세요</option>
          {q.options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {q.type === "rank" && (
        <RankSelectInput
          options={q.options}
          rankCount={q.maxSelections ?? q.options.length}
          rankedOptionIds={state.rank[q.id] ?? []}
          disabled={pending}
          onChange={(rankedOptionIds) => onRank(q.id, rankedOptionIds)}
        />
      )}

      {q.type === "likert_multi" && (
        <LikertMultiInput
          options={q.options}
          values={state.likertMulti[q.id] ?? {}}
          disabled={pending}
          onChange={(optionId, value) => onLikertMulti(q.id, optionId, value)}
        />
      )}

      {q.type === "star_rating" && (
        <StarRatingInput
          value={state.starRating[q.id] ?? null}
          disabled={pending}
          onChange={(value) => onStarRating(q.id, value)}
        />
      )}
    </article>
  );
}
