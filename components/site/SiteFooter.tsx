import Link from "next/link";
import { SiteContainer } from "@/components/site/SiteContainer";
import { PublicAdminFooterLink } from "@/components/site/PublicAdminLink";
import type { SiteNavGroup } from "@/lib/site-homepage";

type Props = {
  siteName: string;
  groups: SiteNavGroup[];
};

export function SiteFooter({ siteName, groups }: Props) {
  const flatItems = groups.flatMap((g) => g.items);

  return (
    <footer className="border-t border-slate-200 bg-white">
      <SiteContainer className="flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">{siteName}</p>
          <p className="mt-2 max-w-md leading-relaxed text-slate-600">
            설문조사·리서치 전문 기관 홈페이지입니다. 상단 메뉴에서 회사 소개, 설문 참여,
            서비스 안내를 확인하실 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {flatItems.length > 0 ? (
            flatItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-slate-600 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))
          ) : (
            <>
              <Link href="/surveys" className="text-slate-600 hover:text-slate-900">
                진행중 설문
              </Link>
              <Link href="/services" className="text-slate-600 hover:text-slate-900">
                서비스
              </Link>
            </>
          )}
          <PublicAdminFooterLink />
        </div>
      </SiteContainer>
      <div className="border-t border-slate-200/80 py-4 text-center text-slate-500">
        © {new Date().getFullYear()} {siteName.replace(/^\[|\]$/g, "").trim() || siteName}. All
        rights reserved.
      </div>
    </footer>
  );
}
