import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyAiGenerator } from "@/components/admin/SurveyAiGenerator";

export const metadata = { title: "AI 설문 생성" };

export default function SurveyAiGeneratePage() {
  return (
    <>
      <AdminHeader
        title="AI 설문 생성"
        description="KSIC·조사 목적을 입력하면 OpenAI가 설문안과 CATI 스크립트를 제안합니다."
      />
      <div className="p-4 sm:p-6">
        <p className="mb-6 text-sm text-brand-700">
          <Link href="/admin/surveys" className="admin-link hover:underline">
            ← 설문 목록
          </Link>
        </p>
        <SurveyAiGenerator />
      </div>
    </>
  );
}
