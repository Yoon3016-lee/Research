"use client";

import {
  CheckSquare,
  ChevronDown,
  CircleDot,
  FileText,
  LayoutList,
  ListOrdered,
  SlidersHorizontal,
  Star,
  TableProperties,
} from "lucide-react";
import {
  QUESTION_TYPE_DESCRIPTIONS,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/survey-types";

const TYPE_META: Record<
  QuestionType,
  { icon: typeof CircleDot; accent: string }
> = {
  mc_single: {
    icon: CircleDot,
    accent:
      "border-violet-200 bg-violet-50/80 hover:border-violet-300 hover:bg-violet-50",
  },
  mc_multi: {
    icon: CheckSquare,
    accent:
      "border-violet-200 bg-violet-50/80 hover:border-violet-300 hover:bg-violet-50",
  },
  dropdown: {
    icon: ChevronDown,
    accent:
      "border-violet-200 bg-violet-50/80 hover:border-violet-300 hover:bg-violet-50",
  },
  rank: {
    icon: ListOrdered,
    accent:
      "border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50",
  },
  text_single: {
    icon: FileText,
    accent:
      "border-sky-200 bg-sky-50/80 hover:border-sky-300 hover:bg-sky-50",
  },
  text_multi: {
    icon: LayoutList,
    accent:
      "border-sky-200 bg-sky-50/80 hover:border-sky-300 hover:bg-sky-50",
  },
  likert_7: {
    icon: SlidersHorizontal,
    accent:
      "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50",
  },
  likert_multi: {
    icon: TableProperties,
    accent:
      "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50",
  },
  star_rating: {
    icon: Star,
    accent:
      "border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50",
  },
};

type Props = {
  onAdd: (type: QuestionType) => void;
  disabled?: boolean;
};

export function QuestionAddPanel({ onAdd, disabled }: Props) {
  const groups: { title: string; types: QuestionType[] }[] = [
    { title: "객관식", types: ["mc_single", "mc_multi", "dropdown"] },
    { title: "순위·척도", types: ["rank", "likert_7", "likert_multi", "star_rating"] },
    { title: "주관식", types: ["text_single", "text_multi"] },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100">
      <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
          문항 추가
        </h3>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          유형을 누르면 목록에 새 문항이 추가됩니다. 추가 후 질문 내용을
          입력하세요.
        </p>
      </div>
      <div className="space-y-4 p-3">
        {groups.map(({ title, types }) => (
          <div key={title}>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {title}
            </p>
            <ul className="space-y-2">
              {types.map((t) => {
                const { icon: Icon, accent } = TYPE_META[t];
                return (
                  <li key={t}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(t)}
                      className={`flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition ${accent} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                        <Icon
                          className="h-4 w-4 shrink-0 text-zinc-600"
                          aria-hidden
                        />
                        {QUESTION_TYPE_LABELS[t]}
                      </span>
                      <span className="pl-6 text-[11px] leading-snug text-zinc-600">
                        {QUESTION_TYPE_DESCRIPTIONS[t]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
