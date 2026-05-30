import { AdminHeader } from "@/components/admin/AdminHeader";
import { HomepageSettingsManager } from "@/components/admin/HomepageSettingsManager";
import { requireSuperAdmin } from "@/lib/require-super-admin";
import { getSiteHomepageConfig, getSitePagesByIds } from "@/lib/site-homepage";

export const metadata = { title: "홈페이지 관리" };

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  await requireSuperAdmin();
  const config = await getSiteHomepageConfig();
  const pageIds = config.groups
    .flatMap((g) => g.items.map((i) => i.pageId))
    .filter((id): id is string => Boolean(id));
  const pages = await getSitePagesByIds(pageIds);

  return (
    <>
      <AdminHeader
        title="홈페이지 관리"
        description="공개 사이트 이름과 각 상단 탭의 하위 메뉴를 편집합니다. 상단 탭 추가·삭제는 「상단 메뉴 관리」에서 합니다."
      />
      <div className="p-4 sm:p-6">
        <HomepageSettingsManager config={config} pages={pages} />
      </div>
    </>
  );
}
