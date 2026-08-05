import Link from "next/link";
import { normalizeImageHref, parseSitePageBody } from "@/lib/site-page-body";

type Props = {
  body: string;
  emptyMessage?: string;
  /** fullBleed: 좌우 여백 없이 이미지가 화면 전체 폭으로 표시 */
  layout?: "default" | "fullBleed";
};

function PageImage({
  url,
  alt,
  href,
  fullBleed,
}: {
  url: string;
  alt: string;
  href: string | null;
  fullBleed: boolean;
}) {
  const imgClass = fullBleed
    ? "block h-auto w-full max-w-none"
    : "block h-auto w-full object-contain";

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt || ""} className={imgClass} />
  );

  const link = href ? normalizeImageHref(href) : null;
  const linked =
    link == null ? (
      img
    ) : link.startsWith("/") ? (
      <Link
        href={link}
        className="block outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand-900/30"
        aria-label={alt ? `${alt} 페이지로 이동` : "연결된 페이지로 이동"}
      >
        {img}
      </Link>
    ) : (
      <a
        href={link}
        className="block outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand-900/30"
        aria-label={alt ? `${alt}로 이동` : "연결된 주소로 이동"}
        {...(link.startsWith("mailto:")
          ? {}
          : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {img}
      </a>
    );

  if (fullBleed) {
    return (
      <figure className="m-0 w-full">
        {linked}
        {alt ? (
          <figcaption className="site-container mx-auto w-full max-w-[var(--site-content-max)] py-2 text-center text-xs text-brand-700/80">
            {alt}
            {link ? <span className="ml-1 text-brand-700/50">(클릭 시 이동)</span> : null}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-brand-900/10 bg-white">
      {linked}
      {alt ? (
        <figcaption className="border-t border-brand-900/10 px-3 py-2 text-center text-xs text-brand-700/80">
          {alt}
          {link ? <span className="ml-1 text-brand-700/50">(클릭 시 이동)</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function SitePageBody({
  body,
  emptyMessage = "콘텐츠가 아직 등록되지 않았습니다.",
  layout = "default",
}: Props) {
  const trimmed = body.trim();
  if (!trimmed) {
    return (
      <p className={`text-brand-700/80 ${layout === "fullBleed" ? "px-4 py-8 sm:px-6" : ""}`}>
        {emptyMessage}
      </p>
    );
  }

  const segments = parseSitePageBody(trimmed);
  const fullBleed = layout === "fullBleed";

  return (
    <div
      className={
        fullBleed
          ? "w-full space-y-0 text-[1.0625rem] leading-relaxed text-brand-800"
          : "space-y-6 text-[1.0625rem] leading-relaxed text-brand-800"
      }
    >
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          const text = seg.value.trim();
          if (!text) return null;
          return (
            <p
              key={i}
              className={
                fullBleed
                  ? "site-container mx-auto w-full max-w-[var(--site-content-max)] whitespace-pre-wrap py-6 sm:py-8"
                  : "whitespace-pre-wrap"
              }
            >
              {seg.value}
            </p>
          );
        }
        if (seg.type === "image") {
          return (
            <PageImage
              key={i}
              url={seg.url}
              alt={seg.alt}
              href={seg.href}
              fullBleed={fullBleed}
            />
          );
        }
        return (
          <div key={i} className={fullBleed ? "w-full space-y-2" : "space-y-2"}>
            <p
              className={
                fullBleed
                  ? "site-container mx-auto w-full max-w-[var(--site-content-max)] font-medium text-slate-900"
                  : "font-medium text-slate-900"
              }
            >
              {seg.label}
            </p>
            <iframe
              title={seg.label}
              src={seg.url}
              className={
                fullBleed
                  ? "h-[min(90vh,960px)] w-full border-0 bg-white"
                  : "h-[min(70vh,720px)] w-full rounded-xl border border-slate-200 bg-white"
              }
            />
            <a
              href={seg.url}
              target="_blank"
              rel="noopener noreferrer"
              className={
                fullBleed
                  ? "site-container mx-auto inline-block w-full max-w-[var(--site-content-max)] text-indigo-600 hover:underline"
                  : "inline-block text-indigo-600 hover:underline"
              }
            >
              PDF 새 창에서 열기
            </a>
          </div>
        );
      })}
    </div>
  );
}
