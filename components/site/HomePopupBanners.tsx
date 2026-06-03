"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  dismissPopupBannerIdForSession,
  filterVisiblePopupBanners,
  snoozePopupBannerIdForToday,
} from "@/lib/popup-banner-storage";
import { SiteContainer } from "@/components/site/SiteContainer";
import type { SiteBanner } from "@/lib/site-banners";

type Props = {
  banners: SiteBanner[];
};

export function HomePopupBanners({ banners }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState<SiteBanner[]>([]);

  useEffect(() => {
    setMounted(true);
    setVisible(filterVisiblePopupBanners(banners));
  }, [banners]);

  const hideBanner = (bannerId: string, snoozeToday: boolean) => {
    if (snoozeToday) {
      snoozePopupBannerIdForToday(bannerId);
    } else {
      dismissPopupBannerIdForSession(bannerId);
    }
    setVisible((prev) => prev.filter((b) => b.id !== bannerId));
  };

  if (!mounted || visible.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 h-0 overflow-visible"
      style={{ top: "calc(var(--site-header-height) + 0.5rem)" }}
      aria-label="팝업 배너"
    >
      <SiteContainer>
        <div className="flex flex-wrap items-start gap-4">
          {visible.map((banner) => (
            <PopupBannerWindow
              key={banner.id}
              banner={banner}
              onClose={(snoozeToday) => hideBanner(banner.id, snoozeToday)}
            />
          ))}
        </div>
      </SiteContainer>
    </div>
  );
}

function PopupBannerWindow({
  banner,
  onClose,
}: {
  banner: SiteBanner;
  onClose: (snoozeToday: boolean) => void;
}) {
  const [snoozeToday, setSnoozeToday] = useState(false);

  return (
    <article
      className="pointer-events-auto w-[min(100%,20rem)] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 sm:w-80 md:w-96"
      role="region"
      aria-label={banner.title || "팝업 배너"}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
          {banner.title || "안내"}
        </p>
        <button
          type="button"
          onClick={() => onClose(snoozeToday)}
          className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-200/80 hover:text-slate-900"
          aria-label="닫기"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="bg-white">
        {banner.linkUrl ? (
          <Link href={banner.linkUrl} className="block">
            <BannerMedia banner={banner} />
          </Link>
        ) : (
          <BannerMedia banner={banner} />
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-slate-600">
          <input
            type="checkbox"
            checked={snoozeToday}
            onChange={(e) => setSnoozeToday(e.target.checked)}
            className="mt-0.5 rounded border-slate-300"
          />
          오늘 더 이상 보지 않기
        </label>
      </div>
    </article>
  );
}

function BannerMedia({ banner }: { banner: SiteBanner }) {
  if (banner.mediaType === "pdf") {
    return (
      <iframe
        title={banner.title || "팝업 PDF"}
        src={banner.fileUrl}
        className="h-48 w-full bg-slate-50 sm:h-52"
      />
    );
  }

  return (
    <div className="flex h-48 w-full items-center justify-center bg-slate-50 p-1.5 sm:h-52">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.fileUrl}
        alt={banner.title || "팝업 배너"}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
