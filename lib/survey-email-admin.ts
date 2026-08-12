import "server-only";

import * as XLSX from "xlsx";
import { mergeEmailBody } from "@/lib/survey-email-merge";
import {
  EMAIL_SEND_BATCH_SIZE,
  EMAIL_SEND_COOLDOWN_MS,
  formatCooldownLabel,
  EMAIL_SEND_INTERVAL_MS,
  formatCooldownWait,
  sleep,
} from "@/lib/survey-email-rate";
import {
  EMAIL_SEND_STATUS_LABELS,
  type EmailSampleRow,
} from "@/lib/survey-email-shared";
import { formatDurationSeconds } from "@/lib/survey-duration";
import { sendPlainTextEmail } from "@/lib/survey-email-send";
import type { ParticipationFormat } from "@/lib/survey-participation-format";
import type { SurveySampleUploadWarnings } from "@/lib/survey-sample-types";
import { isUuid, normalizeSurveyRef } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type { EmailSampleRow } from "@/lib/survey-email-shared";

export type EmailSampleListResult = {
  surveyId: string;
  samplesLockedAt: string | null;
  batchId: string | null;
  nameColumn: string | null;
  rows: EmailSampleRow[];
};

async function resolveSurveyId(ref: string): Promise<string | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  let query = admin.from("surveys").select("id");
  query = isUuid(normalized) ? query.eq("id", normalized) : query.eq("slug", normalized);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function getSurveySamplesLockedAt(
  surveyRef: string,
): Promise<string | null> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) return null;

  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin
    .from("surveys")
    .select("samples_locked_at")
    .eq("id", surveyId)
    .maybeSingle();

  return (data?.samples_locked_at as string | null) ?? null;
}

export async function listEmailSurveySamples(
  surveyRef: string,
): Promise<EmailSampleListResult | null> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) return null;

  const admin = createSupabaseServiceRoleClient();

  const { data: survey } = await admin
    .from("surveys")
    .select("samples_locked_at")
    .eq("id", surveyId)
    .maybeSingle();

  const { data: batch } = await admin
    .from("survey_sample_batches")
    .select("id, name_column")
    .eq("survey_id", surveyId)
    .eq("is_active", true)
    .eq("status", "ready")
    .maybeSingle();

  if (!batch) {
    return {
      surveyId,
      samplesLockedAt: (survey?.samples_locked_at as string | null) ?? null,
      batchId: null,
      nameColumn: null,
      rows: [],
    };
  }

  const { data: samples, error } = await admin
    .from("survey_samples")
    .select("id, uid, email, invite_token, send_status, send_error, sent_at, row_data")
    .eq("batch_id", batch.id as string)
    .order("row_index", { ascending: true });

  if (error || !samples) {
    return {
      surveyId,
      samplesLockedAt: (survey?.samples_locked_at as string | null) ?? null,
      batchId: batch.id as string,
      nameColumn: (batch.name_column as string | null) ?? null,
      rows: [],
    };
  }

  const sampleIds = samples.map((s) => s.id as string);
  const respondedAtBySample = new Map<string, string>();
  const durationBySample = new Map<string, number>();
  if (sampleIds.length > 0) {
    let responses:
      | {
          sample_id: string | null;
          submitted_at: string | null;
          duration_seconds?: number | null;
        }[]
      | null = null;
    const withDuration = await admin
      .from("survey_responses")
      .select("sample_id, submitted_at, duration_seconds")
      .in("sample_id", sampleIds);
    if (withDuration.error?.message?.includes("duration_seconds")) {
      const fallback = await admin
        .from("survey_responses")
        .select("sample_id, submitted_at")
        .in("sample_id", sampleIds);
      responses = fallback.data;
    } else {
      responses = withDuration.data;
    }
    for (const r of responses ?? []) {
      if (!r.sample_id) continue;
      const submitted = (r.submitted_at as string | null) ?? "";
      const prev = respondedAtBySample.get(r.sample_id as string);
      if (!prev || submitted > prev) {
        respondedAtBySample.set(r.sample_id as string, submitted);
        if (typeof r.duration_seconds === "number" && r.duration_seconds >= 0) {
          durationBySample.set(r.sample_id as string, r.duration_seconds);
        } else {
          durationBySample.delete(r.sample_id as string);
        }
      }
    }
  }

  const rows: EmailSampleRow[] = samples.map((s) => {
    const rowData =
      s.row_data && typeof s.row_data === "object"
        ? Object.fromEntries(
            Object.entries(s.row_data as Record<string, unknown>).map(([k, v]) => [
              k,
              v == null ? "" : String(v),
            ]),
          )
        : {};
    return {
      id: s.id as string,
      uid: String(s.uid ?? ""),
      email: String(s.email ?? ""),
      inviteToken: (s.invite_token as string | null) ?? null,
      sendStatus: (s.send_status as EmailSampleRow["sendStatus"]) ?? "pending",
      sendError: (s.send_error as string | null) ?? null,
      sentAt: (s.sent_at as string | null) ?? null,
      responded: respondedAtBySample.has(s.id as string),
      respondedAt: respondedAtBySample.get(s.id as string) ?? null,
      durationSeconds: durationBySample.get(s.id as string) ?? null,
      rowData,
    };
  });

  return {
    surveyId,
    samplesLockedAt: (survey?.samples_locked_at as string | null) ?? null,
    batchId: batch.id as string,
    nameColumn: (batch.name_column as string | null) ?? null,
    rows,
  };
}

export async function previewEmailForSample(params: {
  surveySlug: string;
  template: string;
  sampleId: string;
}): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  const admin = createSupabaseServiceRoleClient();
  const { data: sample, error } = await admin
    .from("survey_samples")
    .select("id, uid, invite_token, row_data, batch_id, survey_id")
    .eq("id", params.sampleId)
    .maybeSingle();

  if (error || !sample?.invite_token) {
    return { ok: false, error: "표본 또는 초대 링크를 찾을 수 없습니다." };
  }

  const [{ data: survey }, { data: batch }] = await Promise.all([
    admin.from("surveys").select("slug").eq("id", sample.survey_id as string).maybeSingle(),
    admin
      .from("survey_sample_batches")
      .select("name_column")
      .eq("id", sample.batch_id as string)
      .maybeSingle(),
  ]);

  const slug = (survey?.slug as string | undefined) ?? params.surveySlug;
  const rowData =
    sample.row_data && typeof sample.row_data === "object"
      ? Object.fromEntries(
          Object.entries(sample.row_data as Record<string, unknown>).map(([k, v]) => [
            k,
            v == null ? "" : String(v),
          ]),
        )
      : {};

  const body = await mergeEmailBody(params.template, {
    slug,
    token: sample.invite_token as string,
    uid: String(sample.uid ?? ""),
    nameColumn: (batch?.name_column as string | null) ?? null,
    rowData,
  });

  return { ok: true, body };
}

export type BulkEmailSendResult = {
  sent: number;
  failed: number;
  skippedNoLink: number;
  /** 아직 발송 완료되지 않은 표본 수(재시도·다음 배치 대상) */
  remaining: number;
  errors: string[];
  warnings: string[];
};

async function countRecentBulkSmtpAttempts(surveyId: string): Promise<{
  count: number;
  oldestAt: Date | null;
}> {
  const admin = createSupabaseServiceRoleClient();
  const since = new Date(Date.now() - EMAIL_SEND_COOLDOWN_MS).toISOString();
  const { data, error } = await admin
    .from("survey_email_sends")
    .select("created_at")
    .eq("survey_id", surveyId)
    .eq("kind", "bulk")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error || !data) return { count: 0, oldestAt: null };
  return {
    count: data.length,
    oldestAt: data[0]?.created_at ? new Date(data[0].created_at as string) : null,
  };
}

export async function sendSurveyBulkEmails(params: {
  surveyRef: string;
  subject: string;
  template: string;
  createdBy: string;
  kind: "test" | "bulk";
  testSampleId?: string;
  confirmMissingLinks?: boolean;
}): Promise<
  | { ok: true; result: BulkEmailSendResult }
  | { ok: false; error: string; missingLinkCount?: number }
> {
  const surveyId = await resolveSurveyId(params.surveyRef);
  if (!surveyId) return { ok: false, error: "설문을 찾을 수 없습니다." };

  const admin = createSupabaseServiceRoleClient();
  const { data: survey } = await admin
    .from("surveys")
    .select("slug, participation_format, samples_locked_at")
    .eq("id", surveyId)
    .maybeSingle();

  if (!survey || survey.participation_format !== "email") {
    return { ok: false, error: "이메일 형식 설문이 아닙니다." };
  }

  const list = await listEmailSurveySamples(params.surveyRef);
  if (!list?.batchId) {
    return { ok: false, error: "활성 표본 배치가 없습니다." };
  }

  let targets = list.rows;
  if (params.kind === "test") {
    if (!params.testSampleId) {
      return { ok: false, error: "테스트 발송할 표본을 선택하세요." };
    }
    targets = targets.filter((r) => r.id === params.testSampleId);
    if (targets.length === 0) {
      return { ok: false, error: "선택한 표본을 찾을 수 없습니다." };
    }
  } else {
    // 이미 발송 완료된 표본은 건너뛰고 이어서 발송
    targets = targets.filter((r) => r.sendStatus !== "sent");
  }

  const missingLinkCount = targets.filter((r) => !r.inviteToken).length;
  if (missingLinkCount > 0 && !params.confirmMissingLinks) {
    return {
      ok: false,
      error: `${missingLinkCount}건의 링크가 없습니다.`,
      missingLinkCount,
    };
  }

  const result: BulkEmailSendResult = {
    sent: 0,
    failed: 0,
    skippedNoLink: 0,
    remaining: 0,
    errors: [],
    warnings: [],
  };

  let sendBudget = targets.length;
  if (params.kind === "bulk") {
    const recent = await countRecentBulkSmtpAttempts(surveyId);
    if (recent.count >= EMAIL_SEND_BATCH_SIZE) {
      const waitMs = recent.oldestAt
        ? Math.max(
            0,
            recent.oldestAt.getTime() + EMAIL_SEND_COOLDOWN_MS - Date.now(),
          )
        : EMAIL_SEND_COOLDOWN_MS;
      return {
        ok: false,
        error: `후이즈 발송 한도 보호: 최근 ${formatCooldownLabel()} 내 ${recent.count}건을 처리했습니다. ${formatCooldownWait(waitMs)} 후 다시 일괄 발송하세요. (1회 최대 ${EMAIL_SEND_BATCH_SIZE}건 · 1초 1건)`,
      };
    }
    sendBudget = Math.min(
      targets.length,
      EMAIL_SEND_BATCH_SIZE - recent.count,
      EMAIL_SEND_BATCH_SIZE,
    );
  }

  /** SMTP를 호출한(또는 호출할) 유효 대상만 예산에 포함 */
  const queue = targets.filter((r) => r.inviteToken && r.email.trim());
  const deferred = Math.max(0, queue.length - sendBudget);
  const toSend = queue.slice(0, sendBudget);
  result.skippedNoLink = targets.filter((r) => !r.inviteToken).length;
  for (const row of targets) {
    if (row.inviteToken && !row.email.trim()) {
      result.failed++;
      result.errors.push(`${row.uid}: 이메일 없음`);
    }
  }

  if (deferred > 0) {
    result.warnings.push(
      `후이즈 제한 보호로 이번 실행은 ${toSend.length}건만 발송합니다. 남은 ${deferred}건은 약 ${formatCooldownLabel()} 후 다시 일괄 발송하세요.`,
    );
  }

  for (let i = 0; i < toSend.length; i++) {
    const row = toSend[i]!;
    if (i > 0) await sleep(EMAIL_SEND_INTERVAL_MS);

    const body = await mergeEmailBody(params.template, {
      slug: survey.slug as string,
      token: row.inviteToken as string,
      uid: row.uid,
      nameColumn: list.nameColumn,
      rowData: row.rowData,
    });

    const sendResult = await sendPlainTextEmail({
      to: row.email,
      subject: params.subject,
      text: body,
    });

    await admin.from("survey_email_sends").insert({
      survey_id: surveyId,
      batch_id: list.batchId,
      sample_id: row.id,
      kind: params.kind,
      recipient_email: row.email,
      subject: params.subject,
      body,
      status: sendResult.ok ? "sent" : "failed",
      error_message: sendResult.ok ? null : sendResult.error,
      sent_at: sendResult.ok ? new Date().toISOString() : null,
      created_by: params.createdBy,
    });

    if (sendResult.ok) {
      result.sent++;
      if (params.kind === "bulk") {
        await admin
          .from("survey_samples")
          .update({
            send_status: "sent",
            send_error: null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }
    } else {
      result.failed++;
      result.errors.push(`${row.uid}: ${sendResult.error}`);
      if (params.kind === "bulk") {
        await admin
          .from("survey_samples")
          .update({
            send_status: "failed",
            send_error: sendResult.error,
          })
          .eq("id", row.id);
      }
    }
  }

  if (params.kind === "bulk") {
    const originalPending = list.rows.filter((r) => r.sendStatus !== "sent").length;
    result.remaining = Math.max(0, originalPending - result.sent);
    // 한도(deferred) 경고는 위에서만 표시. 전부 실패해도 쿨다운 대기로 오해하지 않게 함.
  }

  if (params.kind === "bulk" && result.sent > 0 && !survey.samples_locked_at) {
    await admin
      .from("surveys")
      .update({ samples_locked_at: new Date().toISOString() })
      .eq("id", surveyId);
  }

  return { ok: true, result };
}

export type { SurveySampleUploadWarnings };

function formatExcelDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR");
}

export async function buildEmailDistributionStatusExcel(
  surveyRef: string,
): Promise<
  | { ok: true; filename: string; buffer: Buffer }
  | { ok: false; error: string }
> {
  const list = await listEmailSurveySamples(surveyRef);
  if (!list) {
    return { ok: false, error: "설문을 찾을 수 없습니다." };
  }
  if (list.rows.length === 0) {
    return { ok: false, error: "다운로드할 표본이 없습니다." };
  }

  const matrix: (string | number)[][] = [
    [
      "UID",
      "이메일",
      "이메일 발송여부",
      "실패사유",
      "발송일시",
      "응답결과",
      "응답일시",
      "소요시간(초)",
      "소요시간",
    ],
    ...list.rows.map((row) => [
      row.uid,
      row.email,
      EMAIL_SEND_STATUS_LABELS[row.sendStatus],
      row.sendStatus === "failed" ? (row.sendError ?? "") : "",
      formatExcelDateTime(row.sentAt),
      row.responded ? "응답완료" : "미응답",
      formatExcelDateTime(row.respondedAt),
      row.durationSeconds ?? "",
      formatDurationSeconds(row.durationSeconds),
    ]),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  sheet["!cols"] = [
    { wch: 16 },
    { wch: 32 },
    { wch: 14 },
    { wch: 40 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "발송·응답");
  const buffer = Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer,
  );

  const slug =
    normalizeSurveyRef(surveyRef).replace(/[^\w가-힣.-]+/g, "_").slice(0, 80) ||
    "survey";

  return {
    ok: true,
    filename: `${slug}_email_send_response.xlsx`,
    buffer,
  };
}

export async function getSurveyParticipationFormat(
  surveyRef: string,
): Promise<ParticipationFormat> {
  const surveyId = await resolveSurveyId(surveyRef);
  if (!surveyId) return "site";

  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin
    .from("surveys")
    .select("participation_format")
    .eq("id", surveyId)
    .maybeSingle();

  return data?.participation_format === "email" ? "email" : "site";
}
