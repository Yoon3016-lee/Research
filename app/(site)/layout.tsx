import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSurveyParticipant } from "@/lib/participant";
import { getPublicAdminLinkConfig } from "@/lib/public-admin-link";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminLink = getPublicAdminLinkConfig();
  const participant = await getSurveyParticipant();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <SiteHeader adminLink={adminLink} participant={participant} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
