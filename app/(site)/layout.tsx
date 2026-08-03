import { BannerWidthVar } from "@/components/site/BannerWidthVar";
import { NavGuideBanner, type NavGuideItem } from "@/components/site/NavGuideBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteNameFontLinks } from "@/components/site/SiteNameFontLinks";
import { SiteVisualFrame } from "@/components/site/SiteVisualFrame";
import { kopubBatang, kopubDotum } from "@/lib/kopub-fonts";
import { getSurveyParticipant } from "@/lib/participant";
import { getPublicAdminLinkConfig } from "@/lib/public-admin-link";
import { getSiteHomepageConfig } from "@/lib/site-homepage";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminLink, participant, homepage] = await Promise.all([
    Promise.resolve(getPublicAdminLinkConfig()),
    getSurveyParticipant(),
    getSiteHomepageConfig(),
  ]);

  const guideItems: NavGuideItem[] = homepage.groups
    .filter((g) => Boolean(g.guidePdfUrl) && g.items.length > 0)
    .map((g) => ({
      key: g.key,
      label: g.label,
      hrefs: g.items.map((i) => i.href),
      guidePdfUrl: g.guidePdfUrl as string,
      guideMediaType: g.guideMediaType ?? "pdf",
    }));

  return (
    <>
      <SiteNameFontLinks fontKey={homepage.siteNameFont} />
      <BannerWidthVar />
      <div
        className={`site-public ${kopubDotum.variable} ${kopubBatang.variable} flex min-h-screen flex-col`}
        style={{ ["--font-site-ui" as string]: homepage.siteNameFontFamily }}
      >
        <SiteHeader homepage={homepage} adminLink={adminLink} participant={participant} />
        <SiteVisualFrame>
          <NavGuideBanner items={guideItems} />
          {children}
        </SiteVisualFrame>
        <SiteFooter siteName={homepage.siteName} groups={homepage.groups} />
      </div>
    </>
  );
}
