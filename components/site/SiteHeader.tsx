"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, LayoutDashboard, Sparkles } from "lucide-react";
import type { PublicAdminLinkConfig } from "@/lib/public-admin-link";
import type { SurveyParticipant } from "@/lib/participant-types";
import { SiteAuthNav } from "@/components/site/SiteAuthNav";

const nav = [
  { href: "/", label: "홈", icon: Home },
  { href: "/surveys", label: "진행중 설문", icon: ClipboardList },
  { href: "/services", label: "서비스", icon: Sparkles },
] as const;

const adminLinkClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-900";

type SiteHeaderProps = {
  adminLink: PublicAdminLinkConfig;
  participant: SurveyParticipant;
};

function AdminEntryLink({ adminLink }: { adminLink: PublicAdminLinkConfig }) {
  const label = (
    <>
      <LayoutDashboard className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">관리자</span>
    </>
  );

  if (adminLink.external) {
    return (
      <a
        href={adminLink.href}
        className={adminLinkClass}
        title="관리자 페이지"
        rel="noopener noreferrer"
        target="_blank"
      >
        {label}
      </a>
    );
  }

  return (
    <a href={adminLink.href} className={adminLinkClass} title="관리자 페이지 (로그인 필요)">
      {label}
    </a>
  );
}

export function SiteHeader({ adminLink, participant }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-semibold tracking-tight text-zinc-900"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <ClipboardList className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden truncate sm:inline">Research Hub</span>
          </Link>
        </div>

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto sm:gap-2"
          aria-label="메인 메뉴"
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:px-3 ${
                  active
                    ? "bg-indigo-50 text-indigo-800"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {adminLink.show ? <AdminEntryLink adminLink={adminLink} /> : null}
          <SiteAuthNav participant={participant} />
        </div>
      </div>
    </header>
  );
}
