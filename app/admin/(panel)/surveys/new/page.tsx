import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyNewClient } from "@/components/admin/SurveyNewClient";
import { cloneQuestionsAsTemplate } from "@/lib/survey-template";
import { loadSurveyForEdit } from "@/lib/surveys-admin";
import { getAdminSurveys } from "@/lib/surveys-db";
import type { SurveyTemplateFrom } from "@/components/admin/SurveyBuilderForm";

export const metadata = { title: "새 설문" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ template?: string; from?: string }>;
};

export default async function NewSurveyPage({ searchParams }: Props) {
  const { template: templateSlug, from } = await searchParams;
  const [adminSurveys, templateFrom] = await Promise.all([
    getAdminSurveys(),
    loadTemplateFromSlug(templateSlug),
  ]);

  return (
    <>
      <AdminHeader
        title="새 설문 만들기"
        description="『문항 추가』패널에서 유형을 선택해 문항을 쌓거나, 기존 설문·AI 생성 결과를 불러올 수 있습니다."
      />
      <div className="p-4 sm:p-6">
        <p className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600">
          <Link href="/admin/surveys" className="font-medium text-indigo-700 hover:underline">
            ← 설문 목록
          </Link>
          <Link
            href="/admin/surveys/ai-generate"
            className="font-medium text-indigo-700 hover:underline"
          >
            AI로 설문 생성 →
          </Link>
        </p>
        <SurveyNewClient
          templateFrom={templateFrom}
          templateSurveys={adminSurveys}
          fromAi={from === "ai"}
        />
      </div>
    </>
  );
}

async function loadTemplateFromSlug(
  slug: string | undefined,
): Promise<SurveyTemplateFrom | undefined> {
  const ref = slug?.trim();
  if (!ref || !process.env.SUPABASE_SERVICE_ROLE_KEY) return undefined;

  const loaded = await loadSurveyForEdit(ref);
  if (!loaded.ok || loaded.bundle.questions.length === 0) return undefined;

  return {
    sourceSlug: loaded.bundle.slug,
    sourceTitle: loaded.bundle.title,
    questions: cloneQuestionsAsTemplate(loaded.bundle.questions),
  };
}
