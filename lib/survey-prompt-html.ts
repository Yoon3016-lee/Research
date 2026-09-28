/** 문항 제목 리치텍스트에 허용하는 글자 크기 프리셋 */
export const SURVEY_PROMPT_FONT_SIZES = [
  { label: "작게", value: "0.875rem" },
  { label: "보통", value: "1.125rem" },
  { label: "크게", value: "1.375rem" },
  { label: "아주 크게", value: "1.75rem" },
] as const;

/** 문항 제목 리치텍스트에 허용하는 글씨체 프리셋 */
export const SURVEY_PROMPT_FONT_FAMILIES = [
  { label: "기본", value: "" },
  { label: "Noto Sans KR", value: '"Noto Sans KR", sans-serif' },
  { label: "맑은 고딕", value: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif' },
  { label: "돋움", value: "Dotum, sans-serif" },
  { label: "바탕", value: "Batang, serif" },
] as const;

/** 문항 제목 리치텍스트 색상 팔레트 */
export const SURVEY_PROMPT_COLORS = [
  { label: "기본(검정)", value: "#18181b" },
  { label: "진한 회색", value: "#3f3f46" },
  { label: "파랑", value: "#1d4ed8" },
  { label: "빨강", value: "#dc2626" },
  { label: "초록", value: "#15803d" },
  { label: "주황", value: "#c2410c" },
  { label: "보라", value: "#7c3aed" },
] as const;

const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "span"]);
const VOID_TAGS = new Set(["br"]);
const DROP_CONTENT_TAGS = new Set(["script", "style"]);
const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "font-size",
  "font-family",
  "font-weight",
]);

function sanitizeInlineStyle(style: string): string {
  const kept: string[] = [];
  for (const part of style.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon <= 0) continue;
    const prop = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop) || !value) continue;
    if (/url\s*\(|expression\s*\(|@import|javascript:/i.test(value)) continue;
    kept.push(`${prop}: ${value}`);
  }
  return kept.join("; ");
}

function escapeAttr(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function escapeText(text: string): string {
  return decodeEntities(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function styleAttr(rawAttrs: string): string {
  const match = rawAttrs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const cleaned = sanitizeInlineStyle(match?.[1] ?? match?.[2] ?? "");
  return cleaned ? ` style="${escapeAttr(cleaned)}"` : "";
}

/** 저장·표시용: 허용 태그만 남긴 HTML (jsdom 없이 동작) */
export function sanitizeSurveyPromptHtml(raw: string): string {
  const input = (raw ?? "").trim();
  if (!input) return "";

  if (!/<\/?[a-z]/i.test(input)) {
    return `<p>${escapeText(input).replaceAll("\n", "<br>")}</p>`;
  }

  let out = "";
  let index = 0;
  let skipUntil: string | null = null;
  const tagRe = /<\/?([a-zA-Z][\w:-]*)\b([^<>]*)\/?>/g;
  for (const match of input.matchAll(tagRe)) {
    const start = match.index ?? 0;
    if (!skipUntil) out += escapeText(input.slice(index, start));
    const name = match[1].toLowerCase();
    const isClose = match[0].startsWith("</");
    if (skipUntil) {
      if (isClose && name === skipUntil) skipUntil = null;
    } else if (!isClose && DROP_CONTENT_TAGS.has(name)) {
      skipUntil = name;
    } else if (ALLOWED_TAGS.has(name)) {
      if (VOID_TAGS.has(name)) {
        if (!isClose) out += "<br>";
      } else if (isClose) {
        out += `</${name}>`;
      } else {
        out += `<${name}${styleAttr(match[2])}>`;
      }
    }
    index = start + match[0].length;
  }
  if (!skipUntil) out += escapeText(input.slice(index));

  const trimmed = out.replace(/^(?:<p>\s*<\/p>)+|(?:<p>\s*<\/p>)+$/gi, "").trim();
  if (!trimmed) return "";
  if (!/^<p\b/i.test(trimmed)) return `<p>${trimmed}</p>`;
  return trimmed;
}

/** HTML → 평문 (검증·내보내기·aria 등) */
export function stripSurveyPromptHtml(raw: string): string {
  const input = raw ?? "";
  if (!input.trim()) return "";
  const withoutDanger = input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  const text = decodeEntities(withoutDanger.replace(/<[^>]+>/g, " "));
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function isSurveyPromptEmpty(raw: string): boolean {
  return stripSurveyPromptHtml(raw).length === 0;
}
