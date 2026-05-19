import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <SiteHeader homepage={homepage} adminLink={adminLink} participant={participant} />
      <div className="flex-1">{children}</div>
      <SiteFooter siteName={homepage.siteName} groups={homepage.groups} />
    </div>
  );
}
