import { AdminHeader } from "@/components/admin/AdminHeader";
import { NavGroupsManager } from "@/components/admin/NavGroupsManager";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { getSiteHomepageConfig } from "@/lib/site-homepage";

export const metadata = { title: "상단 메뉴 관리" };

export const dynamic = "force-dynamic";

export default async function AdminNavPage() {
  await requireSuperAdmin();
  const { groups } = await getSiteHomepageConfig();

  return (
    <>
      <AdminHeader
        title="상단 메뉴 관리"
        description="공개 사이트 헤더의 상단 탭(회사 소개 · 설문 조사 · 서비스 등)을 추가·수정·삭제합니다."
      />
      <div className="p-4 sm:p-6">
        <NavGroupsManager groups={groups} />
      </div>
    </>
  );
}
