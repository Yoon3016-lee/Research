"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSurveyAction } from "@/app/actions/delete-survey";

type Props = {
  slug: string;
  title: string;
  responseCount: number;
};

export function SurveyDeleteButton({ slug, title, responseCount }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    const responseNote =
      responseCount > 0
        ? `\n\n저장된 응답 ${responseCount.toLocaleString()}건과 문항·표본 데이터도 함께 삭제됩니다.`
        : "\n\n문항·표본 등 관련 데이터도 함께 삭제됩니다.";
    const ok = confirm(
      `「${title}」설문을 삭제할까요?${responseNote}\n\n이 작업은 되돌릴 수 없습니다.`,
    );
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteSurveyAction(slug);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.push(
        `/admin/surveys?deleted=${encodeURIComponent(slug)}`,
      );
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onDelete}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}
