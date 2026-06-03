"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { PublicAdminLinkConfig } from "@/lib/public-admin-link";
import type { SiteHomepageConfig } from "@/lib/site-homepage";
import type { SurveyParticipant } from "@/lib/participant-types";
import { SITE_HEADER_LABELS } from "@/lib/ui-labels";
import { SiteAuthNav } from "@/components/site/SiteAuthNav";
import { SiteNavMegaMenu } from "@/components/site/SiteNavMegaMenu";

const adminLinkClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.9375rem] font-medium text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-900";

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
    <header className="site-header relative sticky top-0 z-[60] overflow-visible backdrop-blur-sm">
      <div className="site-content-band relative">
        <div className="site-header-content-band" aria-hidden />
        <div className="site-container relative grid min-h-[4.25rem] grid-cols-[1fr_auto_1fr] items-center gap-3 sm:min-h-[4.5rem] sm:gap-4">
          <Link
            href="/"
            className="relative z-[1] justify-self-start text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            {homepage.siteName}
          </Link>

          <nav
            className="site-header-nav-band overflow-visible"
            aria-label={SITE_HEADER_LABELS.mainNavAria}
          >
            <SiteNavMegaMenu groups={homepage.groups} />
          </nav>

          <div className="relative z-[1] flex shrink-0 items-center justify-self-end gap-2">
            {adminLink.show ? <AdminEntryLink adminLink={adminLink} /> : null}
            <SiteAuthNav participant={participant} />
          </div>
        </div>
      </div>
    </header>
  );
}
