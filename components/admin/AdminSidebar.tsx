"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Globe,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/actions/admin-auth";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";

const items = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/surveys", label: "설문 관리", icon: ClipboardList, exact: false },
  { href: "/admin/permissions", label: "권한 관리", icon: ShieldCheck, exact: false },
  { href: "/admin/progress", label: "진행·업무 현황", icon: Users, exact: false },
] as const;

type Props = {
  email: string | null;
  role: string | null;
};

function navLinkClass(active: boolean) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-brand-900/8 text-brand-900 shadow-[inset_0_0_0_1px_rgba(166,139,91,0.22)]"
      : "text-brand-700 hover:bg-brand-900/5 hover:text-brand-900"
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
      <div className="flex h-16 items-center gap-3 border-b border-brand-900/8 px-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400/90 to-accent-600 text-brand-950 shadow-sm">
          <BarChart3 className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-brand-900">Research Hub</p>
          <p className="truncate text-[11px] text-brand-700/70">Admin Console</p>
        </div>
      </div>

      {email ? (
        <div className="border-b border-brand-900/8 px-4 py-3 text-xs">
          <p className="truncate font-medium text-brand-900">{email}</p>
          <p className="mt-0.5 text-brand-700/80">{roleLabel}</p>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-0.5 p-2.5" aria-label="관리자 메뉴">
        {items.map(({ href, label, icon: Icon, exact }) => {
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
              className={navLinkClass(active)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </Link>
          );
        })}
        {role === "super_admin" ? (
          <Link
            href="/admin/homepage"
            className={navLinkClass(isHomepageActive(pathname))}
          >
            <Globe className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            홈페이지 관리
          </Link>
        ) : null}
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
