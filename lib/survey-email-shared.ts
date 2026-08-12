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
  rowData: Record<string, string>;
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
