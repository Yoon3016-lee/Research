import { AdminHeader } from "@/components/admin/AdminHeader";
import { BannersManager } from "@/components/admin/BannersManager";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { listAllSiteBanners } from "@/lib/site-banners";

export const metadata = { title: "배너 관리" };

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await requireSuperAdmin();
  const [popupBanners, topBanners] = await Promise.all([
    listAllSiteBanners("popup"),
    listAllSiteBanners("top"),
  ]);

  return (
    <>
      <AdminHeader
        title="배너 관리"
        description="팝업 배너와 상단 띠 배너를 각각 등록·관리합니다. JPG·PNG·PDF 파일을 업로드할 수 있습니다."
      />
      <div className="space-y-10 p-4 sm:p-6">
        <BannersManager
          placement="top"
          banners={topBanners}
          heading="상단 배너"
          description="헤더 바로 아래 본문 영역에 가로로 표시됩니다. 메인 화면 레이아웃에 포함됩니다."
          createHeading="새 상단 배너 등록"
        />
        <BannersManager
          placement="popup"
          banners={popupBanners}
          heading="팝업 배너"
          description="홈 접속 시 메뉴 아래에 겹쳐 표시됩니다. X·오늘 더 이상 보지 않기로 닫을 수 있습니다."
          createHeading="새 팝업 배너 등록"
        />
      </div>
    </>
  );
}
