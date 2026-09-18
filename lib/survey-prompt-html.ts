import DOMPurify from "isomorphic-dompurify";

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

const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "span"];
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
    // url()/expression 등 차단
    if (/url\s*\(|expression\s*\(|@import|javascript:/i.test(value)) continue;
    kept.push(`${prop}: ${value}`);
  }
  return kept.join("; ");
}

function scrubStylesInHtml(html: string): string {
  return html.replace(/style\s*=\s*(["'])(.*?)\1/gi, (_match, quote: string, style: string) => {
    const cleaned = sanitizeInlineStyle(style);
    return cleaned ? `style=${quote}${cleaned}${quote}` : "";
  });
}

/** 저장·표시용: 허용 태그만 남긴 HTML */
export function sanitizeSurveyPromptHtml(raw: string): string {
  const input = (raw ?? "").trim();
  if (!input) return "";

  // 평문(태그 없음)은 줄바꿈을 <br>로 보존한 문단으로 감쌈
  if (!/<[a-z][\s\S]*>/i.test(input)) {
    const escaped = input
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("\n", "<br>");
    return `<p>${escaped}</p>`;
  }

  const purified = DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["style"],
    ALLOW_DATA_ATTR: false,
  });

  const withSafeStyles = scrubStylesInHtml(purified).trim();
  if (!withSafeStyles) return "";
  // 루트가 인라인만 있으면 p로 감쌈
  if (!/^<(p|div)\b/i.test(withSafeStyles)) {
    return `<p>${withSafeStyles}</p>`;
  }
  return withSafeStyles;
}

/** HTML → 평문 (검증·내보내기·aria 등) */
export function stripSurveyPromptHtml(raw: string): string {
  const input = raw ?? "";
  if (!input.trim()) return "";
  if (!/<[a-z][\s\S]*>/i.test(input)) {
    return input.replace(/\s+/g, " ").trim();
  }
  const text = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSurveyPromptEmpty(raw: string): boolean {
  return stripSurveyPromptHtml(raw).length === 0;
}
