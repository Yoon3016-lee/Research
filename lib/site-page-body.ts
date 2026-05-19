export type SitePageBodySegment =
  | { type: "text"; value: string }
  | { type: "image"; alt: string; url: string }
  | { type: "pdf"; label: string; url: string };

const EMBED_RE =
  /!\[([^\]]*)\]\(([^)]+)\)|\[pdf:([^\]]+)\]\(([^)]+)\)/gi;

export function parseSitePageBody(body: string): SitePageBodySegment[] {
  const segments: SitePageBodySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  EMBED_RE.lastIndex = 0;
  while ((match = EMBED_RE.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      segments.push({ type: "image", alt: match[1], url: match[2] });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      segments.push({ type: "pdf", label: match[3], url: match[4] });
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

export function buildImageEmbed(url: string, alt: string): string {
  return `\n\n![${alt}](${url})\n\n`;
}

export function buildPdfEmbed(url: string, label: string): string {
  return `\n\n[pdf:${label}](${url})\n\n`;
}
