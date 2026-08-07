export type SitePageBodySegment =
  | { type: "text"; value: string }
  | { type: "image"; alt: string; url: string; href: string | null }
  | { type: "pdf"; label: string; url: string }
  | { type: "map"; label: string; url: string };

/**
 * 지원 문법:
 * - 이미지: ![alt](url)
 * - 클릭 이동 이미지: [![alt](url)](/p/contact) 또는 [![alt](url)](https://...)
 * - PDF: [pdf:라벨](url)
 * - 지도 링크: [map:라벨](https://maps... 또는 카카오/네이버 지도 URL)
 */
const EMBED_RE =
  /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)]+)\)|\[pdf:([^\]]+)\]\(([^)]+)\)|\[map:([^\]]+)\]\(([^)]+)\)/gi;

/** 이미지 클릭 링크 — 사이트 내부 경로 또는 http(s)/mailto 만 허용 */
export function normalizeImageHref(raw: string): string | null {
  const href = raw.trim();
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;
  return null;
}

/** 지도 링크 — http(s)만 허용 */
export function normalizeMapHref(raw: string): string | null {
  const href = raw.trim();
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) return href;
  return null;
}

export function parseSitePageBody(body: string): SitePageBodySegment[] {
  const segments: SitePageBodySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  EMBED_RE.lastIndex = 0;
  while ((match = EMBED_RE.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined && match[2] !== undefined && match[3] !== undefined) {
      segments.push({
        type: "image",
        alt: match[1],
        url: match[2].trim(),
        href: normalizeImageHref(match[3]),
      });
    } else if (match[4] !== undefined && match[5] !== undefined) {
      segments.push({
        type: "image",
        alt: match[4],
        url: match[5].trim(),
        href: null,
      });
    } else if (match[6] !== undefined && match[7] !== undefined) {
      segments.push({ type: "pdf", label: match[6], url: match[7].trim() });
    } else if (match[8] !== undefined && match[9] !== undefined) {
      const url = normalizeMapHref(match[9]);
      if (url) {
        segments.push({ type: "map", label: match[8].trim() || "지도에서 보기", url });
      } else {
        segments.push({ type: "text", value: match[0] });
      }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", value: body.slice(lastIndex) });
  }

  if (segments.length === 0 && body.length > 0) {
    segments.push({ type: "text", value: body });
  }

  return segments;
}

export function buildImageEmbed(url: string, alt: string, href?: string | null): string {
  const safeAlt = alt.replace(/[\[\]]/g, "");
  const imageMd = `![${safeAlt}](${url})`;
  const link = href ? normalizeImageHref(href) : null;
  if (link) {
    return `\n\n[${imageMd}](${link})\n\n`;
  }
  return `\n\n${imageMd}\n\n`;
}

export function buildPdfEmbed(url: string, label: string): string {
  return `\n\n[pdf:${label}](${url})\n\n`;
}

export function buildMapLink(url: string, label: string): string {
  const safeLabel = label.replace(/[\[\]]/g, "").trim() || "지도에서 보기";
  const href = normalizeMapHref(url);
  if (!href) return "";
  return `\n\n[map:${safeLabel}](${href})\n\n`;
}
