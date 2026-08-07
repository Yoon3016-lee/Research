"use client";

import { BannersManager } from "@/components/admin/BannersManager";
import { AdminSectionTabPanel } from "@/components/admin/AdminSectionTabPanel";
import { AxiIconSettingsManager } from "@/components/admin/AxiIconSettingsManager";
import { HomepageSettingsManager } from "@/components/admin/HomepageSettingsManager";
import { NavGroupsManager } from "@/components/admin/NavGroupsManager";
import { PublicHomeManager } from "@/components/admin/PublicHomeManager";
import type { SiteBanner } from "@/lib/site-banners";
import type { PublicHomeContent } from "@/lib/public-home-content";
import type { SiteHomepageConfig, SitePage } from "@/lib/site-homepage";

type Props = {
  config: SiteHomepageConfig;
  pages: Record<string, SitePage>;
  topBanners: SiteBanner[];
  popupBanners: SiteBanner[];
  publicHome: PublicHomeContent;
};

const tabs = [
  { id: "nav", label: "상단 메뉴" },
  { id: "homepage", label: "사이트 설정" },
  { id: "public-home", label: "공개홈페이지 관리" },
  { id: "banners", label: "배너" },
  { id: "misc", label: "기타 관리" },
] as const;

export function HomepagePanel({
  config,
  pages,
  topBanners,
  popupBanners,
  publicHome,
}: Props) {
  return (
    <AdminSectionTabPanel tabs={[...tabs]} defaultTabId="nav">
      {(activeId) => {
        if (activeId === "homepage") {
          return (
            <section>
              <HomepageSettingsManager config={config} pages={pages} embedded />
            </section>
          );
        }

        if (activeId === "public-home") {
          return (
            <section>
              <PublicHomeManager content={publicHome} />
            </section>
          );
        }

        if (activeId === "banners") {
          return (
            <section className="space-y-10">
              <BannersManager
                placement="top"
                banners={topBanners}
                heading="상단 배너"
                description="헤더 바로 아래 본문 영역에 가로로 표시됩니다. 현재 공개 홈(/) 메인은 시안 랜딩을 쓰므로 홈에는 표시되지 않고, 필요 시 다른 공개 페이지 연동에 활용할 수 있습니다."
                createHeading="새 상단 배너 등록"
              />
              <BannersManager
                placement="popup"
                banners={popupBanners}
                heading="팝업 배너"
                description="홈 접속 시 메뉴 아래에 겹쳐 표시됩니다. X·오늘 더 이상 보지 않기로 닫을 수 있습니다."
                createHeading="새 팝업 배너 등록"
              />
            </section>
          );
        }

        if (activeId === "misc") {
          return (
            <section className="space-y-8">
              <div>
                <h2 className="text-base font-semibold text-brand-900">기타 관리</h2>
                <p className="mt-1 text-sm text-brand-700/80">
                  AXI 사용 권한·아이콘 등 부가 설정을 관리합니다.
                </p>
              </div>
              <AxiIconSettingsManager
                axiIconUrl={config.axiIconUrl}
                axiAllowedRoles={config.axiAllowedRoles}
              />
            </section>
          );
        }

        return (
          <section>
            <NavGroupsManager groups={config.groups} embedded />
          </section>
        );
      }}
    </AdminSectionTabPanel>
  );
}
