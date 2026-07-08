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
  const displayName = siteName.replace(/^\[|\]$/g, "").trim() || siteName;

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-brand-900 to-brand-950 text-slate-300">
      <SiteContainer className="flex flex-col gap-10 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <p className="site-name-font text-xl font-semibold tracking-tight text-white">
            {displayName}
          </p>
          <p className="mt-3 leading-relaxed text-slate-400">
            설문조사·리서치 전문 플랫폼입니다. 데이터 기반 의사결정을 위한 조사 서비스를
            제공합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {flatItems.length > 0 ? (
            flatItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-slate-400 transition hover:text-accent-400"
              >
                {item.label}
              </Link>
            ))
          ) : (
            <>
              <Link href="/surveys" className="text-slate-400 transition hover:text-accent-400">
                진행중 설문
              </Link>
              <Link href="/services" className="text-slate-400 transition hover:text-accent-400">
                서비스
              </Link>
            </>
          )}
          <PublicAdminFooterLink />
        </div>
      </SiteContainer>
      <div className="border-t border-white/8 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {displayName}. All rights reserved.
      </div>
    </footer>
  );
}
