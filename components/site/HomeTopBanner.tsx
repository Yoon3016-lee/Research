import Link from "next/link";
import type { SiteBanner } from "@/lib/site-banners";

type Props = {
  banners: SiteBanner[];
};

export function HomeTopBanner({ banners }: Props) {
  if (banners.length === 0) return null;

  return (
    <section
      className="relative z-0 w-full border-b border-slate-200 bg-white"
      aria-label="상단 배너"
    >
      <div className="flex flex-col">
        {banners.map((banner, index) => (
          <TopBannerCard key={banner.id} banner={banner} stacked={index > 0} />
        ))}
      </div>
    </section>
  );
}

function TopBannerCard({
  banner,
  stacked,
}: {
  banner: SiteBanner;
  stacked: boolean;
}) {
  const label = banner.title.trim() || "상단 배너";

  const media =
    banner.mediaType === "pdf" ? (
      <iframe
        title={label}
        src={banner.fileUrl}
        className="aspect-[4/1] min-h-[7rem] w-full border-0 bg-slate-50 sm:min-h-[9rem]"
      />
    ) : (
      <div className="relative aspect-[4/1] min-h-[7rem] w-full overflow-hidden bg-slate-50 sm:min-h-[9rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.fileUrl}
          alt={label}
          className="h-full w-full object-cover object-center"
        />
      </div>
    );

  const cardClass = `block w-full transition-opacity hover:opacity-[0.98] ${
    stacked ? "border-t border-slate-200" : ""
  }`;

  if (banner.linkUrl) {
    return (
      <Link href={banner.linkUrl} aria-label={label} className={cardClass}>
        {media}
      </Link>
    );
  }

  return <div className={stacked ? "border-t border-slate-200" : undefined}>{media}</div>;
}
