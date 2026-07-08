import { AdminHeader } from "@/components/admin/AdminHeader";
import { HomepagePanel } from "@/components/admin/HomepagePanel";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { listAllSiteBanners } from "@/lib/site-banners";
import { getSiteHomepageConfig, getSitePagesByIds } from "@/lib/site-homepage";

export const metadata = { title: "홈페이지 관리" };

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  await requireSuperAdmin();
  const [config, popupBanners, topBanners] = await Promise.all([
    getSiteHomepageConfig(),
    listAllSiteBanners("popup"),
    listAllSiteBanners("top"),
  ]);
  const pageIds = config.groups
    .flatMap((g) => g.items.map((i) => i.pageId))
    .filter((id): id is string => Boolean(id));
  const pages = await getSitePagesByIds(pageIds);

  return (
    <>
      <AdminHeader
        title="홈페이지 관리"
        description="상단 메뉴·사이트 설정·배너를 한곳에서 관리합니다."
      />
      <div className="p-4 sm:p-6">
        <HomepagePanel
          config={config}
          pages={pages}
          topBanners={topBanners}
          popupBanners={popupBanners}
        />
      </div>
    </>
  );
}
