import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  SurveyBuilderForm,
  type SurveyTemplateFrom,
} from "@/components/admin/SurveyBuilderForm";
import { cloneQuestionsAsTemplate } from "@/lib/survey-template";
import { loadSurveyForEdit } from "@/lib/surveys-admin";
import { getAdminSurveys } from "@/lib/surveys-db";

export const metadata = { title: "새 설문" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ template?: string }>;
};

export default async function NewSurveyPage({ searchParams }: Props) {
  const { template: templateSlug } = await searchParams;
  const [adminSurveys, templateFrom] = await Promise.all([
    getAdminSurveys(),
    loadTemplateFromSlug(templateSlug),
  ]);

  return (
    <>
      <AdminHeader
        title="새 설문 만들기"
        description="『문항 추가』패널에서 유형을 선택해 문항을 쌓거나, 기존 설문을 템플릿으로 불러올 수 있습니다."
      />
      <div className="p-4 sm:p-6">
        <p className="mb-6 text-sm text-zinc-600">
          <Link href="/admin/surveys" className="font-medium text-indigo-700 hover:underline">
            ← 설문 목록
          </Link>
        </p>
        <SurveyBuilderForm
          templateFrom={templateFrom}
          templateSurveys={adminSurveys}
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
