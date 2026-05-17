import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyBuilderForm } from "@/components/admin/SurveyBuilderForm";

export const metadata = { title: "새 설문" };

export default function NewSurveyPage() {
  return (
    <>
      <AdminHeader
        title="새 설문 만들기"
        description="『문항 추가』패널에서 유형을 선택해 문항을 쌓고, 각 카드에서 질문·보기·무응답 허용 등을 다듬은 뒤 저장합니다."
      />
      <div className="p-4 sm:p-6">
        <p className="mb-6 text-sm text-zinc-600">
          <Link href="/admin/surveys" className="font-medium text-indigo-700 hover:underline">
            ← 설문 목록
          </Link>
        </p>
        <SurveyBuilderForm />
      </div>
    </>
  );
}
