"use server";

import { revalidatePath } from "next/cache";
import {
  listEmailSurveySamples,
  previewEmailForSample,
  sendSurveyBulkEmails,
} from "@/lib/survey-email-admin";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export async function previewSurveyEmailAction(
  slug: string,
  template: string,
  sampleId: string,
): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  await requireAdminPanelAccess();
  return previewEmailForSample({ surveySlug: slug, template, sampleId });
}

export async function sendSurveyEmailAction(params: {
  slug: string;
  subject: string;
  template: string;
  kind: "test" | "bulk";
  testSampleId?: string;
  confirmMissingLinks?: boolean;
}): Promise<
  | {
      ok: true;
      sent: number;
      failed: number;
      skippedNoLink: number;
      errors: string[];
    }
  | { ok: false; error: string; missingLinkCount?: number }
> {
  const { userId } = await requireAdminPanelAccess();

  const result = await sendSurveyBulkEmails({
    surveyRef: params.slug,
    subject: params.subject,
    template: params.template,
    createdBy: userId,
    kind: params.kind,
    testSampleId: params.testSampleId,
    confirmMissingLinks: params.confirmMissingLinks,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      missingLinkCount: result.missingLinkCount,
    };
  }

  revalidatePath("/admin/surveys/distribute");
  revalidatePath("/admin/surveys/samples");

  return {
    ok: true,
    sent: result.result.sent,
    failed: result.result.failed,
    skippedNoLink: result.result.skippedNoLink,
    errors: result.result.errors,
  };
}

export async function loadEmailSurveySamplesAction(slug: string) {
  await requireAdminPanelAccess();
  return listEmailSurveySamples(slug);
}
