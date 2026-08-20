"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FlaskConical } from "lucide-react";
import { seedSurveyResponsesAction } from "@/app/actions/seed-survey-responses";
import { SEED_ADMIN_MAX_COUNT } from "@/lib/seed-survey-responses";

type Props = {
  slug: string;
  title: string;
};

function clampCount(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(SEED_ADMIN_MAX_COUNT, Math.floor(n)));
}

export function SeedSurveyResponsesButton({ slug, title }: Props) {
  const router = useRouter();
  const [countInput, setCountInput] = useState("10");
  const [pending, startTransition] = useTransition();

  const onSeed = () => {
    const count = clampCount(Number(countInput));
    setCountInput(String(count));

    const ok = confirm(
      `「${title}」에 테스트 응답 ${count}건을 추가합니다.\n\n` +
        "표시 조건·조사 종료 분기를 반영해, 실제로 보이는 문항만 채웁니다.\n" +
        "고정 샘플 값이며 실제 응답과 구분되지 않습니다. 계속할까요?",
    );
    if (!ok) return;

    startTransition(async () => {
      const res = await seedSurveyResponsesAction(slug, count);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.push(
        `/admin/progress?survey=${encodeURIComponent(slug)}&seeded=${res.inserted}`,
      );
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2">
      <label className="flex items-center gap-1.5 text-xs font-medium text-amber-950">
        <span className="whitespace-nowrap">건수</span>
        <input
          type="number"
          min={1}
          max={SEED_ADMIN_MAX_COUNT}
          step={1}
          inputMode="numeric"
          value={countInput}
          disabled={pending}
          onChange={(e) => setCountInput(e.target.value)}
          onBlur={() => {
            const n = Number(countInput);
            if (countInput.trim() === "" || !Number.isFinite(n)) {
              setCountInput("1");
              return;
            }
            setCountInput(String(clampCount(n)));
          }}
          className="w-16 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-xs tabular-nums text-amber-950"
          aria-label={`생성 건수 (1~${SEED_ADMIN_MAX_COUNT})`}
        />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={onSeed}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
      >
        <FlaskConical className="h-3.5 w-3.5" aria-hidden />
        {pending ? "생성 중…" : "테스트 응답 생성"}
      </button>
      <span className="text-[0.6875rem] text-amber-900/75">
        1~{SEED_ADMIN_MAX_COUNT}건 · 분기 반영 · 주관식은 고정 샘플
      </span>
    </div>
  );
}
