"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { PublicAdminLinkConfig } from "@/lib/public-admin-link";
import type { SiteHomepageConfig } from "@/lib/site-homepage";
import type { SurveyParticipant } from "@/lib/participant-types";
import { SITE_HEADER_LABELS } from "@/lib/ui-labels";
import { SiteAuthNav } from "@/components/site/SiteAuthNav";
import { SiteNavMegaMenu } from "@/components/site/SiteNavMegaMenu";
import { PrimeaxHashLink } from "@/components/site/PrimeaxHashLink";

const adminLinkClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-900/10 bg-white/90 px-3 py-2 text-[0.9375rem] font-medium text-brand-800 shadow-sm backdrop-blur-sm transition hover:border-accent-500/40 hover:bg-white hover:text-brand-900";

type SiteHeaderProps = {
  homepage: SiteHomepageConfig;
  adminLink: PublicAdminLinkConfig;
  participant: SurveyParticipant;
};

function AdminEntryLink({ adminLink }: { adminLink: PublicAdminLinkConfig }) {
  const label = (
    <>
      <LayoutDashboard className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">{SITE_HEADER_LABELS.admin}</span>
    </>
  );

  if (adminLink.external) {
    return (
      <a
        href={adminLink.href}
        className={adminLinkClass}
        title={SITE_HEADER_LABELS.adminPageTitle}
        rel="noopener noreferrer"
        target="_blank"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={adminLink.href}
      className={adminLinkClass}
      title={SITE_HEADER_LABELS.adminPageTitleLogin}
    >
      {label}
    </Link>
  );
}

export function SiteHeader({ homepage, adminLink, participant }: SiteHeaderProps) {
  return (
    <header className="site-header relative sticky top-0 z-[60] overflow-visible backdrop-blur-md">
      <PrimeaxHashLink
        hash="top"
        className="absolute left-3 top-1/2 z-[2] flex -translate-y-1/2 items-center overflow-visible sm:left-4 lg:left-5"
        aria-label={`${homepage.siteName} 홈`}
      >
        {homepage.logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={homepage.logoUrl}
              alt={homepage.siteName}
              className="h-8 w-auto max-w-[11rem] origin-left object-contain object-left sm:h-9 sm:max-w-[13rem] [transform:scaleX(1.15)]"
            />
          </>
        ) : (
          <span className="site-name-font origin-left text-lg font-semibold tracking-tight text-brand-900 sm:text-xl [transform:scaleX(1.15)]">
            {homepage.siteName}
          </span>
        )}
      </PrimeaxHashLink>

      <div className="site-content-band relative">
        <div className="site-header-content-band" aria-hidden />
        <div className="site-container relative flex min-h-[4.25rem] items-center gap-4 sm:min-h-[4.5rem] sm:gap-5 lg:gap-6">
          <nav
            className="site-header-nav-band min-w-0 flex-1 overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={SITE_HEADER_LABELS.mainNavAria}
          >
            <SiteNavMegaMenu groups={homepage.groups} />
          </nav>

          <div className="relative z-[1] flex shrink-0 items-center gap-2">
            {adminLink.show ? <AdminEntryLink adminLink={adminLink} /> : null}
            <SiteAuthNav participant={participant} />
          </div>
        </div>
      </div>
    </header>
  );
}
