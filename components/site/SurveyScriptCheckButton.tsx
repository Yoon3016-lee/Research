"use client";

import { FileText } from "lucide-react";

const POPUP_FEATURES = [
  "popup=yes",
  "width=440",
  "height=580",
  "left=80",
  "top=60",
  "menubar=no",
  "toolbar=no",
  "location=no",
  "status=no",
  "scrollbars=yes",
  "resizable=yes",
].join(",");

type Props = {
  slug: string;
  surveyTitle: string;
};

export function SurveyScriptCheckButton({ slug, surveyTitle }: Props) {
  const openScriptWindow = () => {
    const url = `/survey-script/${encodeURIComponent(slug)}`;
    const name = `survey-script-${slug}`;
    const existing = window.open("", name, POPUP_FEATURES);
    if (existing) {
      existing.location.href = url;
      existing.focus();
    } else {
      window.open(url, name, POPUP_FEATURES);
    }
  };

  return (
    <button
      type="button"
      onClick={openScriptWindow}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100"
      title={`${surveyTitle} — 응답 스크립트를 별도 창에서 확인`}
    >
      <FileText className="h-4 w-4 shrink-0" aria-hidden />
      스크립트 확인
    </button>
  );
}
