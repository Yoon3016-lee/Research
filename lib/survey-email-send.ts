import "server-only";

import nodemailer from "nodemailer";
import {
  isValidEmailAddress,
  plainTextToEmailHtml,
} from "@/lib/survey-email-shared";

export type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  /** 없으면 평문에서 자동 생성 */
  html?: string;
};

export type SendEmailResult =
  | { ok: true; providerId?: string }
  | { ok: false; error: string };

/** 후이즈 메일 SMTP (STARTTLS 587) */
function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.whoisworks.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = process.env.SMTP_PASS?.trim() || "";
  const from =
    process.env.SURVEY_EMAIL_FROM?.trim() ||
    (user ? `조사안내 <${user}>` : "");

  return { host, port, user, pass, from };
}

export function getSurveyEmailFromAddress(): string | null {
  const { from, user } = getSmtpConfig();
  if (from) return from;
  if (user) return user;
  return null;
}

/** 후이즈 SMTP로 이메일 발송 (평문 + HTML, 링크 클릭 가능) */
export async function sendPlainTextEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const { host, port, user, pass, from } = getSmtpConfig();

  if (!user || !pass) {
    return {
      ok: false,
      error:
        "후이즈 SMTP가 설정되지 않았습니다. .env.local에 SMTP_USER, SMTP_PASS, SURVEY_EMAIL_FROM을 설정하세요.",
    };
  }

  if (!from) {
    return {
      ok: false,
      error: "발신 주소가 없습니다. SURVEY_EMAIL_FROM을 설정하세요.",
    };
  }

  if (!isValidEmailAddress(params.to)) {
    return { ok: false, error: "수신 이메일 주소가 올바르지 않습니다." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      // 후이즈 SMTP는 약한 DH 파라미터를 쓰는 경우가 있어 OpenSSL 3 기본 정책에서 거부됨
      tls: {
        minVersion: "TLSv1",
        ciphers: "DEFAULT:@SECLEVEL=0",
      },
    });

    const html = params.html ?? plainTextToEmailHtml(params.text);

    const info = await transporter.sendMail({
      from,
      to: params.to.trim(),
      subject: params.subject,
      text: params.text,
      html,
    });

    return {
      ok: true,
      providerId: typeof info.messageId === "string" ? info.messageId : undefined,
    };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "이메일 발송 중 오류가 발생했습니다.";
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code ?? "")
        : "";
    if (code === "EAUTH" || /authentication failed|Invalid login/i.test(raw)) {
      return {
        ok: false,
        error:
          "후이즈 SMTP 로그인 실패(535). .env.local의 SMTP_USER·SMTP_PASS가 웹메일 계정·비밀번호와 같은지 확인한 뒤 next dev를 재시작하세요.",
      };
    }
    return { ok: false, error: raw };
  }
}
