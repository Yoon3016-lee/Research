import "server-only";

import type { SiteInquiry, SiteInquiryStatus, SiteInquiryType } from "@/lib/site-inquiry-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

function mapRow(row: Record<string, unknown>): SiteInquiry {
  return {
    id: row.id as string,
    inquiryType: row.inquiry_type as SiteInquiryType,
    status: row.status as SiteInquiryStatus,
    name: row.name as string,
    organization: (row.organization as string | null) ?? null,
    email: row.email as string,
    phone: (row.phone as string | null) ?? null,
    subject: row.subject as string,
    message: row.message as string,
    adminNote: (row.admin_note as string | null) ?? null,
    submittedAt: row.submitted_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listSiteInquiries(filters?: {
  type?: SiteInquiryType | "all";
  status?: SiteInquiryStatus | "all";
}): Promise<{ items: SiteInquiry[]; error?: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { items: [], error: "Supabase가 설정되지 않았습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  let query = admin
    .from("site_inquiries")
    .select(
      "id, inquiry_type, status, name, organization, email, phone, subject, message, admin_note, submitted_at, updated_at",
    )
    .order("submitted_at", { ascending: false });

  if (filters?.type && filters.type !== "all") {
    query = query.eq("inquiry_type", filters.type);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("site_inquiries")) {
      return {
        items: [],
        error:
          "site_inquiries 테이블이 없습니다. supabase/migrations/20260408900000_site_inquiries.sql 을 실행하세요.",
      };
    }
    return { items: [], error: error.message };
  }

  return { items: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) };
}

export async function getSiteInquiryById(id: string): Promise<SiteInquiry | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("site_inquiries")
    .select(
      "id, inquiry_type, status, name, organization, email, phone, subject, message, admin_note, submitted_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}
