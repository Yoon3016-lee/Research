import { AdminHeader } from "@/components/admin/AdminHeader";
import { SharedScriptsManager } from "@/components/admin/SharedScriptsManager";
import { listSharedResponseScripts } from "@/lib/shared-scripts";

export const metadata = { title: "공용 스크립트 관리" };

export const dynamic = "force-dynamic";

export default async function AdminSharedScriptsPage() {
  const scripts = await listSharedResponseScripts();

  return (
    <>
      <AdminHeader
        title="공용 스크립트 관리"
        description="모든 설문에서 직원이 함께 볼 수 있는 공통 스크립트를 등록·수정합니다."
      />
      <div className="p-4 sm:p-6">
        <SharedScriptsManager scripts={scripts} />
      </div>
    </>
  );
}
