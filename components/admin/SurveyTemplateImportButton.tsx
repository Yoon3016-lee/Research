"use client";

import { useState } from "react";
import { FileStack } from "lucide-react";
import {
  SurveyTemplatePicker,
  type SurveyTemplatePickerSurvey,
} from "@/components/admin/SurveyTemplatePicker";

type Props = {
  surveys: SurveyTemplatePickerSurvey[];
  excludeSlug?: string;
  mode: "navigate" | "apply";
  onApply?: Parameters<typeof SurveyTemplatePicker>[0]["onApply"];
  className?: string;
  label?: string;
};

export function SurveyTemplateImportButton({
  surveys,
  excludeSlug,
  mode,
  onApply,
  className,
  label = "템플릿 불러오기",
}: Props) {
  const [open, setOpen] = useState(false);
  const disabled = surveys.filter((s) => s.id !== excludeSlug).length === 0;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        }
        title={disabled ? "불러올 설문이 없습니다" : undefined}
      >
        <FileStack className="h-4 w-4" aria-hidden />
        {label}
      </button>
      <SurveyTemplatePicker
        surveys={surveys}
        excludeSlug={excludeSlug}
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        onApply={onApply}
      />
    </>
  );
}
