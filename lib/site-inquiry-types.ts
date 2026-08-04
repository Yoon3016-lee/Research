export const SITE_INQUIRY_TYPES = ["survey", "service"] as const;
export type SiteInquiryType = (typeof SITE_INQUIRY_TYPES)[number];

export const SITE_INQUIRY_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type SiteInquiryStatus = (typeof SITE_INQUIRY_STATUSES)[number];

export const SITE_INQUIRY_TYPE_LABELS: Record<SiteInquiryType, string> = {
  survey: "조사 문의",
  service: "서비스 문의",
};

export const SITE_INQUIRY_STATUS_LABELS: Record<SiteInquiryStatus, string> = {
  pending: "접수",
  in_progress: "처리 중",
  completed: "완료",
  cancelled: "취소",
};

export type SiteInquiry = {
  id: string;
  inquiryType: SiteInquiryType;
  status: SiteInquiryStatus;
  name: string;
  organization: string | null;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  adminNote: string | null;
  submittedAt: string;
  updatedAt: string;
};

export function parseSiteInquiryType(raw: string | null | undefined): SiteInquiryType {
  const v = raw?.trim().toLowerCase();
  return v === "service" ? "service" : "survey";
}

export function parseSiteInquiryStatus(raw: string | null | undefined): SiteInquiryStatus | null {
  const v = raw?.trim() as SiteInquiryStatus | undefined;
  return v && SITE_INQUIRY_STATUSES.includes(v) ? v : null;
}
