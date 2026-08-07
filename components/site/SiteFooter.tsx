import { PublicAdminFooterLink } from "@/components/site/PublicAdminLink";
import { PrimeaxHashLink } from "@/components/site/PrimeaxHashLink";
import { PRIMEAX_FOOTER } from "@/lib/primeax-public-chrome";

type Props = {
  siteName: string;
  logoUrl?: string | null;
};

export function SiteFooter({ siteName, logoUrl = null }: Props) {
  const displayName =
    siteName.replace(/^\[|\]$/g, "").trim() || PRIMEAX_FOOTER.companyLabel;

  return (
    <footer className="border-t border-[#b7d3ef] bg-gradient-to-br from-[#f7fbff] to-[#eaf5ff] text-[#0b2b59]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-8 sm:px-8 lg:px-10">
        <div className="min-w-0">
          <PrimeaxHashLink hash="top" className="inline-block" aria-label={`${displayName} 홈`}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={displayName}
                className="h-14 w-auto max-w-[11rem] object-contain object-left"
              />
            ) : (
              <span className="site-name-font text-xl font-semibold tracking-tight text-[#0b2b59]">
                {displayName}
              </span>
            )}
          </PrimeaxHashLink>
          <p className="mt-3 text-[0.65rem] font-bold tracking-[0.11em] text-[#587394]">
            {PRIMEAX_FOOTER.tagline}{" "}
            <span className="text-[#ff5a32]">×</span> {PRIMEAX_FOOTER.taglineAccent}
          </p>
        </div>

        <div className="grid gap-3 pt-1" aria-label="회사 정보">
          <p className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm">
            <b className="text-[0.65rem] font-bold tracking-[0.1em] text-[#2e66a6]">
              {PRIMEAX_FOOTER.companyLabel}
            </b>
            <span className="font-medium leading-relaxed text-[#385678]">
              {PRIMEAX_FOOTER.companyNameKo}
            </span>
          </p>
          <p className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm">
            <b className="text-[0.65rem] font-bold tracking-[0.1em] text-[#2e66a6]">ADDRESS</b>
            <span className="font-medium leading-relaxed text-[#385678]">
              {PRIMEAX_FOOTER.address}
            </span>
          </p>
        </div>

        <div className="grid gap-3 pt-1" aria-label="연락처">
          <p className="grid grid-cols-[5.5rem_1fr] items-center gap-3 text-sm">
            <b className="text-[0.65rem] font-bold tracking-[0.1em] text-[#2e66a6]">E-MAIL</b>
            <a
              href={`mailto:${PRIMEAX_FOOTER.email}`}
              className="inline-flex w-max items-center justify-center gap-1.5 rounded-md border border-[#94bde7] bg-white/75 px-2.5 py-1.5 text-xs font-bold text-[#174f92] transition hover:border-[#1767dc] hover:bg-white"
              aria-label="PRIME AX에 이메일로 문의하기"
            >
              <span aria-hidden>✉</span> 이메일 문의
            </a>
          </p>
          <p className="grid grid-cols-[5.5rem_1fr] items-center gap-3 text-sm">
            <b className="text-[0.65rem] font-bold tracking-[0.1em] text-[#2e66a6]">WEB</b>
            <a
              href={PRIMEAX_FOOTER.webHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#385678] transition hover:text-[#1767dc]"
            >
              {PRIMEAX_FOOTER.webLabel}
            </a>
          </p>
          <div className="pt-1">
            <PublicAdminFooterLink className="text-xs text-[#6f87a3] transition hover:text-[#1767dc]" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 border-t border-[#c7ddf2] px-5 py-5 sm:flex-row sm:items-center sm:px-8 lg:px-10">
        <p className="m-0 text-[0.65rem] font-medium tracking-[0.08em] text-[#6f87a3]">
          {PRIMEAX_FOOTER.copyright}
        </p>
        <PrimeaxHashLink
          hash="top"
          className="text-[0.65rem] font-medium tracking-[0.08em] text-[#2f6ab1] transition hover:text-[#1767dc]"
        >
          {PRIMEAX_FOOTER.backToTopLabel}
        </PrimeaxHashLink>
      </div>
    </footer>
  );
}
