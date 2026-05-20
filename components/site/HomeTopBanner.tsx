import Link from "next/link";
import type { SiteBanner } from "@/lib/site-banners";

type Props = {
  banners: SiteBanner[];
};

export function HomeTopBanner({ banners }: Props) {
  if (banners.length === 0) return null;

  return (
    <section className="relative z-0 border-b border-slate-200 bg-white" aria-label="상단 배너">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {banners.map((banner) => (
            <TopBannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TopBannerCard({ banner }: { banner: SiteBanner }) {
  const label = banner.title.trim() || "상단 배너";

  const media =
    banner.mediaType === "pdf" ? (
      <iframe
        title={label}
        src={banner.fileUrl}
        className="aspect-[4/1] min-h-24 w-full rounded-lg border border-slate-100 bg-slate-50 sm:min-h-28"
      />
    ) : (
      <div className="relative aspect-[4/1] min-h-24 w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50 sm:min-h-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.fileUrl}
          alt={label}
          className="h-full w-full object-contain object-center"
        />
      </div>
    );

  const inner = <div className="min-w-0 flex-1">{media}</div>;

  if (banner.linkUrl) {
    return (
      <Link
        href={banner.linkUrl}
        aria-label={label}
        className="block min-w-0 flex-1 transition opacity-95 hover:opacity-100"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
