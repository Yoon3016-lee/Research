export type EmailMergeContext = {
  slug: string;
  token: string;
  uid: string;
  nameColumn: string | null;
  rowData: Record<string, string>;
};

export type EmailSampleRow = {
  id: string;
  uid: string;
  email: string;
  inviteToken: string | null;
  sendStatus: "pending" | "sent" | "failed";
  sendError: string | null;
  sentAt: string | null;
  responded: boolean;
  respondedAt: string | null;
  durationSeconds: number | null;
  rowData: Record<string, string>;
};

export const EMAIL_SEND_STATUS_LABELS: Record<EmailSampleRow["sendStatus"], string> = {
  pending: "미발송",
  sent: "발송완료",
  failed: "실패",
};

/** 간단한 이메일 형식 검증 */
export function isValidEmailAddress(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** `(OOO님)` / `()` 형태 — 이름 치환 실패 시 괄호만 */
export function formatHonorificName(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `(${trimmed}님)` : "()";
}

export function defaultEmailInviteTemplate(): string {
  return `(OOO님) 조사에 참여해 주시기 바랍니다.

아래 링크에서 설문에 응답해 주세요.

{{링크}}

감사합니다.`;
}

export function resolveMergeName(context: EmailMergeContext): string {
  if (context.nameColumn) {
    const fromColumn = context.rowData[context.nameColumn]?.trim();
    if (fromColumn) return fromColumn;
  }
  return "";
}

/** 링크 URL을 알 때 서버·클라이언트 공용 치환 */
export function mergeEmailBodyWithLink(
  template: string,
  context: EmailMergeContext,
  link: string,
): string {
  const name = resolveMergeName(context);

  let out = template;
  out = out.split("{{링크}}").join(link);
  out = out.split("{{UID}}").join(context.uid);

  if (out.includes("{{이름}}")) {
    out = out.split("{{이름}}").join(name);
  }

  const honorific = formatHonorificName(name);
  out = out.replace(/\(OOO님\)/g, honorific);

  out = out.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
    const k = key.trim();
    if (k === "링크" || k === "UID" || k === "이름") return _match;
    const fromRow = context.rowData[k];
    return fromRow != null ? fromRow : "";
  });

  return out;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 평문 → HTML 본문 조각 (미리보기용, 문서 래퍼 없음) */
export function plainTextToEmailHtmlFragment(text: string): string {
  const escaped = escapeHtml(text);
  const withBreaks = escaped.replace(/\r\n|\r|\n/g, "<br>\n");
  return withBreaks.replace(/(https?:\/\/[^\s<]+)/gi, (rawUrl) => {
    let href = rawUrl;
    let trailing = "";
    while (/[.,;:!?)\]}>]$/.test(href)) {
      trailing = `${href.slice(-1)}${trailing}`;
      href = href.slice(0, -1);
    }
    if (!href) return rawUrl;
    return `<a href="${href}" style="color:#0b57d0;word-break:break-all">${href}</a>${trailing}`;
  });
}

/**
 * 평문 본문 → 메일용 HTML 문서.
 * 줄바꿈·URL 자동 링크만 처리 (관리자는 평문 편집 유지).
 */
export function plainTextToEmailHtml(text: string): string {
  const body = plainTextToEmailHtmlFragment(text);
  return [
    `<!DOCTYPE html>`,
    `<html><head><meta charset="utf-8"></head>`,
    `<body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#222">`,
    body,
    `</body></html>`,
  ].join("");
}
