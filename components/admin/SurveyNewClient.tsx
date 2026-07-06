"use client";

import { useEffect, useState } from "react";
import {
  SurveyBuilderForm,
  type SurveyTemplateFrom,
} from "@/components/admin/SurveyBuilderForm";
import type { SurveyTemplatePickerSurvey } from "@/components/admin/SurveyTemplatePicker";
import { rehydrateSurveyAiDraftPayload } from "@/lib/survey-ai/draft-payload";
import {
  SURVEY_AI_DRAFT_STORAGE_KEY,
  type SurveyAiDraftPayload,
} from "@/lib/survey-ai/types";
import type { CreateSurveyPayload } from "@/lib/survey-types";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import { Loader2 } from "lucide-react";

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
  /** fromAi일 때 sessionStorage 복원이 끝난 뒤에만 편집기 마운트 */
  const [hydrated, setHydrated] = useState(!fromAi);

  useEffect(() => {
    if (!fromAi) return;
    try {
      const raw = sessionStorage.getItem(SURVEY_AI_DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SurveyAiDraftPayload;
        sessionStorage.removeItem(SURVEY_AI_DRAFT_STORAGE_KEY);
        setAiDraft(rehydrateSurveyAiDraftPayload(parsed));
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, [fromAi]);

  const builderKey = aiDraft
    ? `ai-${aiDraft.meta.proposalId}`
    : templateFrom
      ? `tpl-${templateFrom.sourceSlug}`
      : "new-survey";

  if (!hydrated) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        AI 설문안을 편집기에 불러오는 중…
      </div>
    );
  }

  return (
    <>
      {aiDraft ? (
        <div className="mb-6 space-y-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-5 py-4 text-sm text-indigo-950">
            <p className="font-semibold">AI 생성 설문안이 적용되었습니다</p>
            <p className="mt-1 text-xs font-medium text-indigo-800">
              문항 {aiDraft.initial.questions.length}개가 편집기에 로드되었습니다. 추가·수정·삭제한 뒤
              저장하세요.
            </p>
            <p className="mt-2 leading-relaxed">{aiDraft.meta.rationale}</p>
            <p className="mt-2 text-xs text-indigo-800/80">
              KSIC 적합성: {aiDraft.meta.ksicRelevance}
            </p>
          </div>

          {aiDraft.meta.improvements.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 px-5 py-4 text-sm text-amber-950">
              <p className="font-semibold">보완·개선 제안</p>
              <ul className="mt-3 space-y-2">
                {aiDraft.meta.improvements.map((note, i) => (
                  <li key={i} className="rounded-lg border border-amber-100 bg-white px-3 py-2">
                    <span className="font-medium">{note.area}</span>
                    <p className="mt-0.5 text-zinc-700">{note.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {aiDraft.meta.additionalQuestions.length > 0 ? (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/40 px-5 py-4 text-sm text-teal-950">
              <p className="font-semibold">추가 문항 생성 방향</p>
              <ul className="mt-3 space-y-2">
                {aiDraft.meta.additionalQuestions.map((idea, i) => (
                  <li key={i} className="rounded-lg border border-teal-100 bg-white px-3 py-2">
                    <p className="font-medium">{idea.direction}</p>
                    {idea.reason ? (
                      <p className="mt-0.5 text-xs text-zinc-600">{idea.reason}</p>
                    ) : null}
                    {idea.suggestedType ? (
                      <p className="mt-1 text-xs text-teal-800">
                        권장 유형:{" "}
                        {QUESTION_TYPE_LABELS[
                          idea.suggestedType as keyof typeof QUESTION_TYPE_LABELS
                        ] ?? idea.suggestedType}
                      </p>
                    ) : null}
                    {idea.examplePrompt ? (
                      <p className="mt-1 text-xs text-zinc-600">예시: {idea.examplePrompt}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <SurveyBuilderForm
        key={builderKey}
        initial={aiDraft?.initial}
        templateFrom={aiDraft ? undefined : templateFrom}
        templateSurveys={templateSurveys}
      />
    </>
  );
}
