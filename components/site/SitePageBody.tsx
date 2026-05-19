import { parseSitePageBody } from "@/lib/site-page-body";

type Props = {
  body: string;
  emptyMessage?: string;
};

export function SitePageBody({
  body,
  emptyMessage = "\ucf58\ud150\uce20\uac00 \uc544\uc9c1 \ub4f1\ub85d\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.",
}: Props) {
  const trimmed = body.trim();
  if (!trimmed) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  const segments = parseSitePageBody(trimmed);

  return (
    <div className="space-y-6 text-sm leading-relaxed text-slate-700">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          const text = seg.value.trim();
          if (!text) return null;
          return (
            <p key={i} className="whitespace-pre-wrap">
              {seg.value}
            </p>
          );
        }
        if (seg.type === "image") {
          return (
            <figure key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={seg.url}
                alt={seg.alt || ""}
                className="mx-auto max-h-[min(70vh,640px)] w-full object-contain"
              />
              {seg.alt ? (
                <figcaption className="border-t border-slate-200 px-3 py-2 text-center text-xs text-slate-500">
                  {seg.alt}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        return (
          <div key={i} className="space-y-2">
            <p className="font-medium text-slate-900">{seg.label}</p>
            <iframe
              title={seg.label}
              src={seg.url}
              className="h-[min(70vh,720px)] w-full rounded-xl border border-slate-200 bg-white"
            />
            <a
              href={seg.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-indigo-600 hover:underline"
            >
              PDF {"\uc0c8 \ucc3d\uc5d0\uc11c \uc5f4\uae30"}
            </a>
          </div>
        );
      })}
    </div>
  );
}
