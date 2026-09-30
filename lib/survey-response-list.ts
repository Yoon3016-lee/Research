import "server-only";

import { ROLE_LABELS, isStaffRole, type StaffRole } from "@/lib/roles";
import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export const SURVEY_RESPONSE_PAGE_SIZE = 20;

export type SurveyResponseEntry = {
  id: string;
  submittedAt: string;
  kind: "staff" | "guest";
  userId: string | null;
  email: string | null;
  roleLabel: string | null;
  sampleUid: string | null;
};

export type SurveyResponseList = {
  entries: SurveyResponseEntry[];
  total: number;
  page: number;
  pageSize: number;
};

type ResponseRow = {
  id: string;
  submitted_at: string;
  respondent_kind: string | null;
  respondent_user_id: string | null;
  sample_id: string | null;
};

function parsePage(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

async function resolveSurveyId(slug: string): Promise<string | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(slug);
  if (!normalized) return null;
  const bySlug = await admin.from("surveys").select("id").eq("slug", normalized).maybeSingle();
  if (bySlug.data?.id) return bySlug.data.id as string;
  if (isUuid(normalized)) {
    const byId = await admin.from("surveys").select("id").eq("id", normalized).maybeSingle();
    if (byId.data?.id) return byId.data.id as string;
  }
  return null;
}

/** 제출 시각 최신순. entryFilter: all | guest | staff:<userId> */
export async function listSurveyResponses(opts: {
  slug: string;
  page?: number;
  entryFilter?: string;
}): Promise<SurveyResponseList | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const surveyId = await resolveSurveyId(opts.slug);
  if (!surveyId) return null;

  const pageSize = SURVEY_RESPONSE_PAGE_SIZE;
  const requested = parsePage(opts.page ?? 1);
  const filter = opts.entryFilter?.trim() || "all";

  const admin = createSupabaseServiceRoleClient();
  const from = (requested - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .from("survey_responses")
    .select("id, submitted_at, respondent_kind, respondent_user_id, sample_id", {
      count: "exact",
    })
    .eq("survey_id", surveyId)
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false });

  if (filter === "guest") {
    query = query.or("respondent_kind.eq.guest,respondent_kind.is.null");
  } else if (filter.startsWith("staff:")) {
    const userId = filter.slice("staff:".length);
    if (isUuid(userId)) {
      query = query.eq("respondent_kind", "staff").eq("respondent_user_id", userId);
    }
  }

  const { data, error, count } = await query.range(from, to);
  if (error) {
    console.error("[listSurveyResponses]", error.message);
    return { entries: [], total: 0, page: 1, pageSize };
  }

  const rows = (data ?? []) as ResponseRow[];
  const total = count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, pageCount);

  if (requested !== page) {
    return listSurveyResponses({ ...opts, page });
  }

  const userIds = [
    ...new Set(rows.map((row) => row.respondent_user_id).filter((id): id is string => Boolean(id))),
  ];
  const profiles = new Map<string, { email: string | null; role: string }>();
  if (userIds.length > 0) {
    const { data: profileRows } = await admin
      .from("profiles")
      .select("id, email, role")
      .in("id", userIds);
    for (const profile of profileRows ?? []) {
      profiles.set(profile.id as string, {
        email: (profile.email as string | null) ?? null,
        role: (profile.role as string) ?? "guest",
      });
    }
  }

  const sampleIds = [
    ...new Set(rows.map((row) => row.sample_id).filter((id): id is string => Boolean(id))),
  ];
  const sampleUids = new Map<string, string>();
  if (sampleIds.length > 0) {
    const { data: samples } = await admin
      .from("survey_samples")
      .select("id, uid")
      .in("id", sampleIds);
    for (const sample of samples ?? []) {
      sampleUids.set(sample.id as string, String(sample.uid ?? ""));
    }
  }

  const entries: SurveyResponseEntry[] = rows.map((row) => {
    const kind = row.respondent_kind === "staff" ? "staff" : "guest";
    const profile = row.respondent_user_id ? profiles.get(row.respondent_user_id) : undefined;
    const role = profile?.role ?? null;
    const roleLabel =
      kind === "staff" && role && isStaffRole(role) ? ROLE_LABELS[role as StaffRole] : null;
    return {
      id: row.id,
      submittedAt: row.submitted_at,
      kind,
      userId: row.respondent_user_id,
      email: profile?.email ?? null,
      roleLabel,
      sampleUid: row.sample_id ? sampleUids.get(row.sample_id) || null : null,
    };
  });

  return { entries, total, page, pageSize };
}
