import "server-only";

import {
  mergeEmailBodyWithLink,
  type EmailMergeContext,
} from "@/lib/survey-email-shared";
import { buildInviteParticipateUrl } from "@/lib/survey-invite-token";

export type { EmailMergeContext } from "@/lib/survey-email-shared";

export async function mergeEmailBody(
  template: string,
  context: EmailMergeContext,
): Promise<string> {
  const link = await buildInviteParticipateUrl(context.slug, context.token);
  return mergeEmailBodyWithLink(template, context, link);
}
