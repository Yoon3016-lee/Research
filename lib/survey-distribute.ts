import "server-only";

import { headers } from "next/headers";

/** 설문 참여 URL (배포 메시지·초대 링크용) */
export async function getSurveyParticipateUrl(slug: string): Promise<string> {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_SITE_URL?.trim();
  if (fromEnv) {
    return `${fromEnv.replace(/\/$/, "")}/survey/${slug}`;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${proto}://${host}/survey/${slug}`;
  }

  return `/survey/${slug}`;
}

export function buildDefaultDistributeMessage(title: string, participateUrl: string): string {
  return `안녕하세요.

「${title}」 설문 조사에 참여해 주시기 바랍니다.
아래 링크를 통해 응답해 주세요.

링크: ${participateUrl}

감사합니다.`;
}
