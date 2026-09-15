import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyOptionTemplatesManager } from "@/components/admin/SurveyOptionTemplatesManager";
import { listSurveyOptionTemplates } from "@/lib/survey-option-templates";

export const metadata = { title: "보기 자동완성 템플릿" };

export const dynamic = "force-dynamic";

export default async function SurveyOptionTemplatesPage() {
  const templates = await listSurveyOptionTemplates();

  return (
    <>
      <AdminHeader
        title="보기 자동완성 템플릿"
        description="객관식(단일·다중·순위선택) 문항에 불러올 보기 목록을 저장합니다. 한 줄에 보기 하나씩 입력하세요."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <p className="flex flex-wrap items-center gap-4 text-sm text-brand-700">
          <Link href="/admin/surveys" className="admin-link hover:underline">
            ← 설문 목록
          </Link>
        </p>
        <SurveyOptionTemplatesManager templates={templates} />
      </div>
    </>
  );
}
