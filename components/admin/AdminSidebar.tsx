"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/actions/admin-auth";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";

const items = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/surveys", label: "설문 관리", icon: ClipboardList, exact: false },
  {
    href: "/admin/shared-scripts",
    label: "공용 스크립트 관리",
    icon: FileText,
    exact: false,
  },
  { href: "/admin/staff", label: "직원 권한 관리", icon: ShieldCheck, exact: false },
  { href: "/admin/emails", label: "이메일 발송", icon: Mail, exact: false },
  { href: "/admin/progress", label: "진행·업무 현황", icon: Users, exact: false },
] as const;

type Props = {
  email: string | null;
  role: string | null;
};

export function AdminSidebar({ email, role }: Props) {
  const pathname = usePathname();
  const roleLabel =
    role && role in ROLE_LABELS
      ? ROLE_LABELS[role as StaffRole]
      : "역할 없음";

  return (
    <aside className="flex w-full flex-col border-r border-zinc-200 bg-white lg:w-56">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
          <BarChart3 className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-zinc-900">관리자</p>
          <p className="truncate text-xs text-zinc-500">Research Hub</p>
        </div>
      </div>

      {email ? (
        <div className="border-b border-zinc-100 px-4 py-3 text-xs text-zinc-600">
          <p className="truncate font-medium text-zinc-800">{email}</p>
          <p className="mt-0.5 text-zinc-500">{roleLabel}</p>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="관리자 메뉴">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </Link>
          );
        })}
        {role === "super_admin" ? (
          <Link
            href="/admin/settings"
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/admin/settings")
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <KeyRound className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            가입키 설정
          </Link>
        ) : null}
      </nav>
      <div className="space-y-1 border-t border-zinc-100 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            로그아웃
          </button>
        </form>
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        >
          ← 공개 사이트로
        </Link>
      </div>
    </aside>
  );
}
