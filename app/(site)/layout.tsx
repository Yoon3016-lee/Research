import { BannerWidthVar } from "@/components/site/BannerWidthVar";
import { AxiSiteHost } from "@/components/site/AxiSiteContext";
import { NavGuideBanner, type NavGuideItem } from "@/components/site/NavGuideBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteNameFontLinks } from "@/components/site/SiteNameFontLinks";
import { SiteVisualFrame } from "@/components/site/SiteVisualFrame";
import { kopubBatang, kopubDotum } from "@/lib/kopub-fonts";
import { canUseAxi } from "@/lib/axi/access";
import { getSurveyParticipant } from "@/lib/participant";
import { getSiteHomepageConfig } from "@/lib/site-homepage";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [participant, homepage] = await Promise.all([
    getSurveyParticipant(),
    getSiteHomepageConfig(),
  ]);

  const guideItems: NavGuideItem[] = homepage.groups
    .filter((g) => Boolean(g.guidePdfUrl) && g.items.length > 0)
    .map((g) => ({
      key: g.key,
      label: g.label,
      links: g.items.map((i) => ({ href: i.href, label: i.label })),
      guidePdfUrl: g.guidePdfUrl as string,
      guideMediaType: g.guideMediaType ?? "pdf",
    }));

  const showAxi = canUseAxi(participant, homepage.axiAllowedRoles);
  /** 직원은 설문 참여 화면에서 AXI를 쓰지 않음 (목록·홈 등에서는 유지) */
  const hideAxiOnSurveyPaths = participant.mode === "staff";

  const shell = (
    <>
      <SiteHeader homepage={homepage} participant={participant} />
      <SiteVisualFrame>
        <NavGuideBanner items={guideItems} />
        {children}
      </SiteVisualFrame>
      <SiteFooter siteName={homepage.siteName} logoUrl={homepage.logoUrl} />
    </>
  );

  return (
    <>
      <SiteNameFontLinks fontKey={homepage.siteNameFont} />
      <BannerWidthVar />
      <div
        className={`site-public ${kopubDotum.variable} ${kopubBatang.variable} flex min-h-screen flex-col`}
        style={{ ["--font-site-ui" as string]: homepage.siteNameFontFamily }}
      >
        {showAxi ? (
          <AxiSiteHost
            axiIconUrl={homepage.axiIconUrl}
            hideOnSurveyPaths={hideAxiOnSurveyPaths}
          >
            {shell}
          </AxiSiteHost>
        ) : (
          shell
        )}
      </div>
    </>
  );
}
