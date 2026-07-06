"use client";

import { useEffect, useState } from "react";
import {
  SurveyBuilderForm,
  type SurveyTemplateFrom,
} from "@/components/admin/SurveyBuilderForm";
import type { SurveyTemplatePickerSurvey } from "@/components/admin/SurveyTemplatePicker";
import {
  SURVEY_AI_DRAFT_STORAGE_KEY,
  type SurveyAiDraftPayload,
} from "@/lib/survey-ai/types";
import type { CreateSurveyPayload } from "@/lib/survey-types";

type Props = {
  templateFrom?: SurveyTemplateFrom;
  templateSurveys: SurveyTemplatePickerSurvey[];
  fromAi?: boolean;
};

export function SurveyNewClient({ templateFrom, templateSurveys, fromAi }: Props) {
  const [aiDraft, setAiDraft] = useState<{
    initial: CreateSurveyPayload;
    meta: SurveyAiDraftPayload["aiSource"];
  } | null>(null);

  useEffect(() => {
    if (!fromAi) return;
    try {
      const raw = sessionStorage.getItem(SURVEY_AI_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SurveyAiDraftPayload;
      sessionStorage.removeItem(SURVEY_AI_DRAFT_STORAGE_KEY);
      const { aiSource, ...payload } = parsed;
      setAiDraft({ initial: payload, meta: aiSource });
    } catch {
      /* ignore */
    }
  }, [fromAi]);

  return (
    <>
      {aiDraft ? (
        <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 px-5 py-4 text-sm text-indigo-950">
          <p className="font-semibold">AI 생성 설문안이 적용되었습니다</p>
          <p className="mt-2 leading-relaxed">{aiDraft.meta.rationale}</p>
          <p className="mt-2 text-xs text-indigo-800/80">
            KSIC 적합성: {aiDraft.meta.ksicRelevance}
          </p>
          <p className="mt-2 text-xs text-indigo-700">
            제목·기간·문항·스크립트를 확인한 뒤 저장하세요.
          </p>
        </div>
      ) : null}
      <SurveyBuilderForm
        initial={aiDraft?.initial}
        templateFrom={aiDraft ? undefined : templateFrom}
        templateSurveys={templateSurveys}
      />
    </>
  );
}
