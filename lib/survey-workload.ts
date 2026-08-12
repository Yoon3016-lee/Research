import "server-only";

import { isStaffRole, ROLE_LABELS, type StaffRole } from "@/lib/roles";
import { normalizeSurveyRef, isUuid } from "@/lib/survey-slug";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase-paginate";

export type StaffWorkloadRow = {
  userId: string;
  email: string;
  role: StaffRole;
  roleLabel: string;
  count: number;
};

export type SurveyWorkloadStats = {
  slug: string;
  title: string;
  totalSubmissions: number;
  staff: StaffWorkloadRow[];
  guestTotal: number;
  guestAnonymous: number;
  guestLoggedIn: number;
};

type ResponseRow = {
  respondent_user_id: string | null;
  respondent_kind: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  role: string;
};

type SurveyRow = {
  id: string;
  slug: string;
  title: string;
};

function aggregateResponses(
  rows: ResponseRow[],
  profiles: Map<string, ProfileRow>,
): {
  staff: StaffWorkloadRow[];
  guestTotal: number;
  guestAnonymous: number;
  guestLoggedIn: number;
} {
  const staffCounts = new Map<string, number>();
  let guestTotal = 0;
  let guestAnonymous = 0;
  let guestLoggedIn = 0;

  for (const row of rows) {
    if (row.respondent_kind === "staff" && row.respondent_user_id) {
      staffCounts.set(
        row.respondent_user_id,
        (staffCounts.get(row.respondent_user_id) ?? 0) + 1,
      );
      continue;
    }

    guestTotal += 1;
    if (row.respondent_user_id) {
      guestLoggedIn += 1;
    } else {
      guestAnonymous += 1;
    }
  }

  const staff: StaffWorkloadRow[] = [];
  for (const [userId, count] of staffCounts) {
    const profile = profiles.get(userId);
    const role = (profile?.role ?? "employee") as StaffRole;
    if (!isStaffRole(role)) continue;
    staff.push({
      userId,
      email: profile?.email ?? "(알 수 없음)",
      role,
      roleLabel: ROLE_LABELS[role],
      count,
    });
  }

  staff.sort((a, b) => b.count - a.count || a.email.localeCompare(b.email, "ko"));

  return { staff, guestTotal, guestAnonymous, guestLoggedIn };
}

async function loadProfilesForUserIds(userIds: string[]): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>();
  if (userIds.length === 0) return map;

  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, role")
    .in("id", userIds);

  for (const p of (data ?? []) as ProfileRow[]) {
    map.set(p.id, p);
  }
  return map;
}

async function fetchSurveyByRef(ref: string): Promise<SurveyRow | null> {
  const admin = createSupabaseServiceRoleClient();
  const normalized = normalizeSurveyRef(ref);
  if (!normalized) return null;

  const select = "id, slug, title";
  const bySlug = await admin.from("surveys").select(select).eq("slug", normalized).maybeSingle();
  if (bySlug.data) return bySlug.data as SurveyRow;

  if (isUuid(normalized)) {
    const byId = await admin.from("surveys").select(select).eq("id", normalized).maybeSingle();
    if (byId.data) return byId.data as SurveyRow;
  }

  return null;
}

export async function getSurveyWorkload(ref: string): Promise<SurveyWorkloadStats | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const survey = await fetchSurveyByRef(ref);
  if (!survey) return null;

  const admin = createSupabaseServiceRoleClient();
  let responseRows: ResponseRow[] = [];
  try {
    responseRows = await fetchAllPages<ResponseRow>(async (from, to) =>
      admin
        .from("survey_responses")
        .select("respondent_user_id, respondent_kind")
        .eq("survey_id", survey.id)
        .order("submitted_at", { ascending: true })
        .range(from, to),
    );
  } catch (err) {
    console.error("[getSurveyWorkload]", err);
    return null;
  }
  const staffUserIds = [
    ...new Set(
      responseRows
        .filter((r) => r.respondent_kind === "staff" && r.respondent_user_id)
        .map((r) => r.respondent_user_id as string),
    ),
  ];
  const profiles = await loadProfilesForUserIds(staffUserIds);
  const agg = aggregateResponses(responseRows, profiles);

  return {
    slug: survey.slug,
    title: survey.title,
    totalSubmissions: responseRows.length,
    staff: agg.staff,
    guestTotal: agg.guestTotal,
    guestAnonymous: agg.guestAnonymous,
    guestLoggedIn: agg.guestLoggedIn,
  };
}
