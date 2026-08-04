"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import {
  parseSiteInquiryStatus,
  parseSiteInquiryType,
} from "@/lib/site-inquiry-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SiteInquiryActionState = {
  error?: string;
  ok?: boolean;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitSiteInquiryAction(
  _prev: SiteInquiryActionState,
  formData: FormData,
): Promise<SiteInquiryActionState> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "문의 접수를 일시적으로 사용할 수 없습니다." };
  }

  const inquiryType = parseSiteInquiryType(String(formData.get("inquiry_type") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { error: "이름을 입력하세요." };
  if (!email) return { error: "이메일을 입력하세요." };
  if (!isValidEmail(email)) return { error: "올바른 이메일 주소를 입력하세요." };
  if (!subject) return { error: "문의 제목을 입력하세요." };
  if (!message) return { error: "문의 내용을 입력하세요." };
  if (message.length > 10000) return { error: "문의 내용은 10,000자 이내로 입력하세요." };

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin.from("site_inquiries").insert({
    inquiry_type: inquiryType,
    status: "pending",
    name,
    organization: organization || null,
    email,
    phone: phone || null,
    subject,
    message,
  });

  if (error) {
    if (error.message.includes("site_inquiries")) {
      return { error: "문의 접수 기능이 아직 준비되지 않았습니다. 관리자에게 문의하세요." };
    }
    return { error: error.message };
  }

  return { ok: true };
}

export async function updateSiteInquiryAction(
  _prev: SiteInquiryActionState,
  formData: FormData,
): Promise<SiteInquiryActionState> {
  await requireAdminPanelAccess();

  const id = String(formData.get("id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const adminNote = String(formData.get("admin_note") ?? "").trim();

  if (!id) return { error: "문의 ID가 없습니다." };

  const status = parseSiteInquiryStatus(statusRaw);
  if (!status) return { error: "처리 상태가 올바르지 않습니다." };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Supabase가 설정되지 않았습니다." };
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin
    .from("site_inquiries")
    .update({
      status,
      admin_note: adminNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/inquiries");
  return { ok: true };
}
