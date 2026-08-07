"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PRIMEAX_HOME_NAV,
  scrollToPrimeaxSectionWhenReady,
} from "@/lib/primeax-public-chrome";

type Props = {
  /** 우측 PROJECT INQUIRY CTA 표시 */
  showInquiryCta?: boolean;
};

export function PrimeaxHomeNav({ showInquiryCta = true }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const sync = () => setActiveHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    scrollToPrimeaxSectionWhenReady(hash);
  }, [pathname]);

  const goToSection = (hash: string) => {
    const target = `/#${hash}`;
    if (pathname === "/") {
      scrollToPrimeaxSectionWhenReady(hash);
      window.history.replaceState(null, "", target);
      setActiveHash(hash);
      return;
    }
    router.push(target);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 sm:gap-x-2">
      <nav
        className="flex flex-wrap items-end justify-center gap-x-0.5 sm:gap-x-1"
        aria-label="PRIME AX 주요 메뉴"
      >
        {PRIMEAX_HOME_NAV.map((item) => {
          const active = pathname === "/" && activeHash === item.hash;
          return (
            <Link
              key={item.key}
              href={`/#${item.hash}`}
              onClick={(e) => {
                e.preventDefault();
                goToSection(item.hash);
              }}
              className={`whitespace-nowrap rounded-t-md border-b-[3px] px-2 py-2.5 text-center text-[0.7rem] font-extrabold tracking-tight transition sm:px-3 sm:text-[0.8rem] lg:text-[0.85rem] ${
                active
                  ? "border-brand-900 text-brand-900"
                  : "border-transparent text-brand-800 hover:border-brand-900/30 hover:text-brand-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {showInquiryCta ? (
        <button
          type="button"
          onClick={() => goToSection("contact")}
          className="ml-1 hidden shrink-0 items-center gap-1 rounded-md border border-[#88b9ef] bg-[rgba(242,248,255,0.74)] px-2.5 py-1.5 text-[0.65rem] font-bold tracking-wide text-[#104788] transition hover:border-[#1767dc] hover:bg-white sm:inline-flex sm:text-[0.7rem]"
        >
          PROJECT INQUIRY
          <span className="text-[#ff5a32]" aria-hidden>
            ↗
          </span>
        </button>
      ) : null}
    </div>
  );
}

/** 홈이 아닌 페이지에서 `/#section` 진입 시 스크롤 보정에 사용 */
export function usePrimeaxHashScrollOnHome() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    scrollToPrimeaxSectionWhenReady(hash);
  }, [pathname]);
}
