import "server-only";

import { randomBytes } from "crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { getSurveyParticipateUrl } from "@/lib/survey-distribute";

export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/** 배치 내 invite_token이 없는 표본에 토큰을 일괄 부여합니다. */
export async function ensureBatchInviteTokens(batchId: string): Promise<void> {
  const admin = createSupabaseServiceRoleClient();
  const { data: rows, error } = await admin
    .from("survey_samples")
    .select("id, invite_token")
    .eq("batch_id", batchId);

  if (error || !rows?.length) return;

  for (const row of rows) {
    if (row.invite_token) continue;
    for (let attempt = 0; attempt < 5; attempt++) {
      const token = generateInviteToken();
      const { error: updateError } = await admin
        .from("survey_samples")
        .update({ invite_token: token })
        .eq("id", row.id as string)
        .is("invite_token", null);
      if (!updateError) break;
      if (!updateError.message.includes("invite_token")) break;
    }
  }
}

export type ResolvedSurveyInvite = {
  sampleId: string;
  uid: string;
  email: string;
  rowData: Record<string, string>;
  surveyId: string;
  surveySlug: string;
  surveyTitle: string;
  batchId: string;
  nameColumn: string | null;
  alreadyResponded: boolean;
};

export async function resolveSurveyInviteByToken(
  token: string,
): Promise<ResolvedSurveyInvite | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const admin = createSupabaseServiceRoleClient();
  const { data: sample, error } = await admin
    .from("survey_samples")
    .select("id, uid, email, row_data, survey_id, batch_id, invite_token")
    .eq("invite_token", trimmed)
    .maybeSingle();

  if (error || !sample) return null;

  const { data: batch } = await admin
    .from("survey_sample_batches")
    .select("name_column")
    .eq("id", sample.batch_id as string)
    .maybeSingle();

  const { data: survey } = await admin
    .from("surveys")
    .select("id, slug, title, participation_format")
    .eq("id", sample.survey_id as string)
    .maybeSingle();

  if (!survey || survey.participation_format !== "email") return null;

  const { data: existingResponse } = await admin
    .from("survey_responses")
    .select("id")
    .eq("sample_id", sample.id as string)
    .maybeSingle();

  const batchJoin = batch;
  const rowData =
    sample.row_data && typeof sample.row_data === "object"
      ? Object.fromEntries(
          Object.entries(sample.row_data as Record<string, unknown>).map(([k, v]) => [
            k,
            v == null ? "" : String(v),
          ]),
        )
      : {};

  return {
    sampleId: sample.id as string,
    uid: String(sample.uid ?? ""),
    email: String(sample.email ?? ""),
    rowData,
    surveyId: survey.id as string,
    surveySlug: survey.slug as string,
    surveyTitle: survey.title as string,
    batchId: sample.batch_id as string,
    nameColumn: (batchJoin?.name_column as string | null) ?? null,
    alreadyResponded: Boolean(existingResponse),
  };
}

export async function buildInviteParticipateUrl(
  slug: string,
  token: string,
): Promise<string> {
  const base = await getSurveyParticipateUrl(slug);
  const normalized = base.replace(/\/$/, "");
  return `${normalized}/i/${encodeURIComponent(token)}`;
}
