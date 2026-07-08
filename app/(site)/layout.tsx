import { Noto_Sans_KR, Source_Serif_4 } from "next/font/google";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteNameFontLinks } from "@/components/site/SiteNameFontLinks";
import { SiteVisualFrame } from "@/components/site/SiteVisualFrame";
import { getSurveyParticipant } from "@/lib/participant";
import { getPublicAdminLinkConfig } from "@/lib/public-admin-link";
import { getSiteHomepageConfig } from "@/lib/site-homepage";

const siteBody = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-site-body",
  display: "swap",
});

const siteDisplay = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-site-display",
  display: "swap",
});

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

  return (
    <>
      <SiteNameFontLinks fontKey={homepage.siteNameFont} />
      <div
        className={`site-public ${siteBody.className} ${siteBody.variable} ${siteDisplay.variable} flex min-h-screen flex-col`}
        style={{ ["--font-site-name" as string]: homepage.siteNameFontFamily }}
      >
        <SiteHeader homepage={homepage} adminLink={adminLink} participant={participant} />
        <SiteVisualFrame>{children}</SiteVisualFrame>
        <SiteFooter siteName={homepage.siteName} groups={homepage.groups} />
      </div>
    </>
  );
}
