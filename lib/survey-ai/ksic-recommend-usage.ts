import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/roles";

const VISITOR_COOKIE = "ksic_rec_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400일

/** 공개 홈 체험 기본 한도 (환경변수로 조정 가능, 기본 3회) */
export function getKsicRecommendPublicLimit(): number {
  const raw = process.env.KSIC_RECOMMEND_PUBLIC_LIMIT?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 3;
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(n, 20);
}

export type KsicRecommendUsageSnapshot = {
  used: number;
  limit: number;
  remaining: number;
};

export type KsicRecommendSubject =
  | { kind: "user"; userId: string }
  | { kind: "visitor"; visitorKey: string };

export type KsicRecommendAccess =
  | {
      ok: true;
      subject: KsicRecommendSubject;
      channel: "admin" | "public";
      usage?: KsicRecommendUsageSnapshot;
    }
  | {
      ok: false;
      status: "unauthorized" | "limit_exceeded";
      message: string;
      usage?: KsicRecommendUsageSnapshot;
    };

function snapshot(used: number, limit: number): KsicRecommendUsageSnapshot {
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

function newVisitorKey(): string {
  return crypto.randomUUID();
}

async function getOrCreateVisitorKey(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value?.trim();
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    return existing;
  }
  const key = newVisitorKey();
  jar.set(VISITOR_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  return key;
}

async function readUsageBySubject(subject: KsicRecommendSubject): Promise<number> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return 0;
  const admin = createSupabaseServiceRoleClient();
  const query = admin.from("ksic_recommend_usage").select("use_count");
  const { data } =
    subject.kind === "user"
      ? await query.eq("user_id", subject.userId).maybeSingle()
      : await query.eq("visitor_key", subject.visitorKey).maybeSingle();
  return typeof data?.use_count === "number" ? data.use_count : 0;
}

async function incrementUsageBySubject(
  subject: KsicRecommendSubject,
): Promise<number> {
  const admin = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const current = await readUsageBySubject(subject);
  const next = current + 1;

  if (subject.kind === "user") {
    const { error } = await admin.from("ksic_recommend_usage").upsert(
      {
        user_id: subject.userId,
        visitor_key: null,
        use_count: next,
        last_used_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      throw new Error(`체험 횟수 저장에 실패했습니다: ${error.message}`);
    }
  } else {
    const { data: existing } = await admin
      .from("ksic_recommend_usage")
      .select("id, use_count")
      .eq("visitor_key", subject.visitorKey)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await admin
        .from("ksic_recommend_usage")
        .update({
          use_count: next,
          last_used_at: now,
          updated_at: now,
        })
        .eq("id", existing.id);
      if (error) {
        throw new Error(`체험 횟수 저장에 실패했습니다: ${error.message}`);
      }
    } else {
      const { error } = await admin.from("ksic_recommend_usage").insert({
        visitor_key: subject.visitorKey,
        user_id: null,
        use_count: next,
        last_used_at: now,
        updated_at: now,
      });
      if (error) {
        throw new Error(`체험 횟수 저장에 실패했습니다: ${error.message}`);
      }
    }
  }

  return next;
}

/**
 * 채널별 접근 검사.
 * - admin: 관리자 패널 권한, 횟수 제한 없음
 * - public: 로그인·비로그인 모두 가능, 주체(회원/방문자)당 체험 한도
 */
export async function assertKsicRecommendAccess(
  channel: "admin" | "public",
): Promise<KsicRecommendAccess> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (channel === "admin") {
    if (!user) {
      return {
        ok: false,
        status: "unauthorized",
        message: "로그인이 필요합니다.",
      };
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        ok: false,
        status: "unauthorized",
        message: "서버 설정이 없어 사용할 수 없습니다.",
      };
    }
    const admin = createSupabaseServiceRoleClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role ?? "guest";
    if (!canAccessAdminPanel(role)) {
      return {
        ok: false,
        status: "unauthorized",
        message: "관리자 권한이 필요합니다.",
      };
    }
    return {
      ok: true,
      subject: { kind: "user", userId: user.id },
      channel: "admin",
    };
  }

  // public trial — 로그인 시 회원 단위, 아니면 방문자 쿠키 단위
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      status: "unauthorized",
      message: "서버 설정이 없어 사용할 수 없습니다.",
    };
  }

  const subject: KsicRecommendSubject = user
    ? { kind: "user", userId: user.id }
    : { kind: "visitor", visitorKey: await getOrCreateVisitorKey() };

  const limit = getKsicRecommendPublicLimit();
  const used = await readUsageBySubject(subject);
  const usage = snapshot(used, limit);
  if (used >= limit) {
    return {
      ok: false,
      status: "limit_exceeded",
      message: `체험 가능 횟수(${limit}회)를 모두 사용했습니다.`,
      usage,
    };
  }
  return { ok: true, subject, channel: "public", usage };
}

/** 공개 체험 1회 차감 */
export async function consumeKsicRecommendPublicUse(
  subject: KsicRecommendSubject,
): Promise<KsicRecommendUsageSnapshot> {
  const limit = getKsicRecommendPublicLimit();
  const used = await incrementUsageBySubject(subject);
  return snapshot(used, limit);
}

/** 공개 홈 체험 잔여 횟수 (비로그인도 조회 가능) */
export async function getKsicRecommendPublicUsageForCurrentUser(): Promise<{
  status: "ok";
  identity: "user" | "visitor";
  usage: KsicRecommendUsageSnapshot;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subject: KsicRecommendSubject = user
    ? { kind: "user", userId: user.id }
    : { kind: "visitor", visitorKey: await getOrCreateVisitorKey() };

  const used = await readUsageBySubject(subject);
  return {
    status: "ok",
    identity: subject.kind === "user" ? "user" : "visitor",
    usage: snapshot(used, getKsicRecommendPublicLimit()),
  };
}
