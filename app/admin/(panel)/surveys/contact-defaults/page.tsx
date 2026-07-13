import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CatiContactOptionsPanel } from "@/components/admin/CatiContactOptionsPanel";
import { listGlobalCatiContactOptions } from "@/lib/cati-contact-options";

export const metadata = { title: "전체 컨택 관리" };

export const dynamic = "force-dynamic";

export default async function GlobalContactPage() {
  const contact = await listGlobalCatiContactOptions();

  return (
    <>
      <AdminHeader
        title="전체 컨택 관리"
        description="모든 설문에 공통으로 적용되는 기본 컨택 결과 선택지를 설정합니다. 개별 설문에서 별도로 저장한 선택지가 있으면 그 설문에는 개별 설정이 우선합니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <p className="flex flex-wrap items-center gap-4 text-sm text-brand-700">
          <Link href="/admin/surveys" className="admin-link hover:underline">
            ← 설문 목록
          </Link>
        </p>

        <CatiContactOptionsPanel
          title="전체 설문 공통 컨택 선택지"
          description="여기서 저장한 선택지가 모든 CATI 설문에 공통으로 적용됩니다."
          initialOptions={contact.options}
          usingDefaults={contact.usingDefaults}
        />
      </div>
    </>
  );
}
