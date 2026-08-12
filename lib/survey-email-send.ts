import "server-only";

import { isValidEmailAddress } from "@/lib/survey-email-shared";

export type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; providerId?: string }
  | { ok: false; error: string };

/** Resend API 또는 SMTP 환경변수로 이메일 발송 */
export async function sendPlainTextEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const from =
    process.env.SURVEY_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "onboarding@resend.dev";
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error:
        "이메일 발송 API가 설정되지 않았습니다. .env.local에 RESEND_API_KEY와 SURVEY_EMAIL_FROM을 설정하세요.",
    };
  }

  if (!isValidEmailAddress(params.to)) {
    return { ok: false, error: "수신 이메일 주소가 올바르지 않습니다." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to.trim()],
        subject: params.subject,
        text: params.text,
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!res.ok) {
      return { ok: false, error: body.message ?? `발송 실패 (${res.status})` };
    }

    return { ok: true, providerId: body.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "이메일 발송 중 오류가 발생했습니다.",
    };
  }
}
