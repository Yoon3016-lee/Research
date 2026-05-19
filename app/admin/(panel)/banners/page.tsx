import { AdminHeader } from "@/components/admin/AdminHeader";
import { BannersManager } from "@/components/admin/BannersManager";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { listAllSiteBanners } from "@/lib/site-banners";

export const metadata = { title: "팝업 배너 관리" };

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await requireSuperAdmin();
  const banners = await listAllSiteBanners();

  return (
    <>
      <AdminHeader
        title="팝업 배너 관리"
        description="홈 접속 시 상단 메뉴 바로 아래에 가로로 순서대로 표시됩니다. X·오늘 더 이상 보지 않기로 닫을 수 있습니다."
      />
      <div className="p-4 sm:p-6">
        <BannersManager banners={banners} />
      </div>
    </>
  );
}
