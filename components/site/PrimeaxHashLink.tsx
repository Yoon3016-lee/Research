"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode, MouseEvent } from "react";
import { scrollToPrimeaxSectionWhenReady } from "@/lib/primeax-public-chrome";

type Props = {
  hash: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

/** 공개 홈 Shadow DOM 섹션으로 스크롤하는 해시 링크 */
export function PrimeaxHashLink({ hash, className, children, ...rest }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const id = hash.replace(/^#/, "");

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = `/#${id}`;
    if (pathname === "/") {
      scrollToPrimeaxSectionWhenReady(id);
      window.history.replaceState(null, "", target);
      return;
    }
    router.push(target);
  };

  return (
    <Link href={`/#${id}`} onClick={onClick} className={className} {...rest}>
      {children}
    </Link>
  );
}
