"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { PublicAdminLinkConfig } from "@/lib/public-admin-link";
import type { SiteHomepageConfig } from "@/lib/site-homepage";
import type { SurveyParticipant } from "@/lib/participant-types";
import { SITE_HEADER_LABELS } from "@/lib/ui-labels";
import { SiteAuthNav } from "@/components/site/SiteAuthNav";
import { SiteNavDropdown } from "@/components/site/SiteNavDropdown";

const adminLinkClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-900";

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
    <header className="sticky top-0 z-50 overflow-visible border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="justify-self-start text-base font-bold tracking-tight text-slate-900 sm:text-lg"
        >
          {homepage.siteName}
        </Link>

        <nav
          className="flex items-center justify-center gap-0.5 overflow-visible sm:gap-1"
          aria-label={SITE_HEADER_LABELS.mainNavAria}
        >
          {homepage.groups.map((group) => (
            <SiteNavDropdown key={group.key} group={group} />
          ))}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center justify-self-end gap-2">
          {adminLink.show ? <AdminEntryLink adminLink={adminLink} /> : null}
          <SiteAuthNav participant={participant} />
        </div>
      </div>
    </header>
  );
}
