import Link from "next/link";
import { PublicAdminFooterLink } from "@/components/site/PublicAdminLink";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold text-zinc-900">Research Hub</p>
          <p className="mt-1 max-w-sm text-sm text-zinc-600">
            기업·기관용 설문조사·리서치 플랫폼. 응답 수집부터 분석·배포까지 한곳에서
            관리할 수 있도록 설계했습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/surveys" className="text-zinc-600 hover:text-zinc-900">
            진행중 설문
          </Link>
          <Link href="/services" className="text-zinc-600 hover:text-zinc-900">
            서비스
          </Link>
          <PublicAdminFooterLink />
        </div>
      </div>
      <div className="border-t border-zinc-200/80 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Research Hub. All rights reserved.
      </div>
    </footer>
  );
}
