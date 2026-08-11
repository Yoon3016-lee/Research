"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  DatabaseBackup,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/actions/admin-auth";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";

type NavColor = "indigo" | "emerald" | "amber" | "sky" | "rose";

const colorStyles: Record<
  NavColor,
  { base: string; active: string }
> = {
  indigo: {
    base: "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700",
    active: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/25",
  },
  emerald: {
    base: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/25",
  },
  amber: {
    base: "text-amber-600 hover:bg-amber-50 hover:text-amber-700",
    active: "bg-amber-50 text-amber-700 ring-1 ring-amber-500/25",
  },
  sky: {
    base: "text-sky-600 hover:bg-sky-50 hover:text-sky-700",
    active: "bg-sky-50 text-sky-700 ring-1 ring-sky-500/25",
  },
  rose: {
    base: "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
    active: "bg-rose-50 text-rose-700 ring-1 ring-rose-500/25",
  },
};

const items = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true, color: "indigo" },
  { href: "/admin/surveys", label: "설문 관리", icon: ClipboardList, exact: false, color: "emerald" },
  { href: "/admin/inquiries", label: "문의 관리", icon: MessageSquare, exact: false, color: "rose" },
  { href: "/admin/permissions", label: "권한 관리", icon: ShieldCheck, exact: false, color: "amber" },
  { href: "/admin/progress", label: "진행·업무 현황", icon: Users, exact: false, color: "sky" },
  { href: "/admin/backups", label: "응답 백업", icon: DatabaseBackup, exact: false, color: "indigo" },
] as const;

type Props = {
  email: string | null;
  role: string | null;
};

function navLinkClass(active: boolean, color: NavColor) {
  const style = colorStyles[color];
  return `flex items-center gap-3 rounded-xl px-3.5 py-3 text-[0.95rem] font-semibold tracking-tight transition-colors ${
    active ? style.active : style.base
  }`;
}

function isSurveysActive(pathname: string): boolean {
  return (
    pathname.startsWith("/admin/surveys") ||
    pathname.startsWith("/admin/shared-scripts") ||
    pathname.startsWith("/admin/emails")
  );
}

function isPermissionsActive(pathname: string): boolean {
  return (
    pathname.startsWith("/admin/permissions") ||
    pathname.startsWith("/admin/staff") ||
    pathname.startsWith("/admin/settings")
  );
}

function isHomepageActive(pathname: string): boolean {
  return (
    pathname.startsWith("/admin/homepage") ||
    pathname.startsWith("/admin/nav") ||
    pathname.startsWith("/admin/banners")
  );
}

export function AdminSidebar({ email, role }: Props) {
  const pathname = usePathname();
  const roleLabel =
    role && role in ROLE_LABELS
      ? ROLE_LABELS[role as StaffRole]
      : "역할 없음";

  return (
    <aside className="admin-sidebar">
      <div className="flex min-h-[4.8rem] items-center gap-3 border-b border-brand-900/8 px-4 py-2.5">
        <span className="flex h-[2.7rem] w-[2.7rem] shrink-0 items-center justify-center rounded-[0.6rem] bg-gradient-to-br from-accent-400/90 to-accent-600 text-brand-950 shadow-sm">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[1.05rem] font-semibold text-brand-900">
            Research Hub
          </p>
          <p className="truncate text-[0.825rem] text-brand-700/70">Admin Console</p>
        </div>
      </div>

      {email ? (
        <div className="border-b border-brand-900/8 px-4 py-3">
          <p className="truncate text-[1rem] font-medium text-brand-900">{email}</p>
          <p className="mt-0.5 truncate text-[1rem] text-brand-700/80">{roleLabel}</p>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-1 p-2.5" aria-label="관리자 메뉴">
        {items.map(({ href, label, icon: Icon, exact, color }) => {
          const active = exact
            ? pathname === href
            : href === "/admin/surveys"
              ? isSurveysActive(pathname)
              : href === "/admin/permissions"
                ? isPermissionsActive(pathname)
                : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={navLinkClass(active, color)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
        {role === "super_admin" ? (
          <Link
            href="/admin/homepage"
            className={navLinkClass(isHomepageActive(pathname), "rose")}
          >
            <Globe className="h-5 w-5 shrink-0" aria-hidden />
            홈페이지 관리
          </Link>
        ) : null}
        <a
          href="https://go.whoisworks.com"
          target="_blank"
          rel="noopener noreferrer"
          className={navLinkClass(false, "sky")}
        >
          <Mail className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">Mail Page</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        </a>
      </nav>
      <div className="space-y-1 border-t border-brand-900/8 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="admin-btn-secondary flex w-full items-center justify-center gap-2 py-2 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            로그아웃
          </button>
        </form>
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-brand-700/80 transition hover:bg-brand-900/5 hover:text-brand-900"
        >
          ← 공개 사이트로
        </Link>
      </div>
    </aside>
  );
}
