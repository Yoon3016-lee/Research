import { AdminHeader } from "@/components/admin/AdminHeader";
import { InquiriesManager } from "@/components/admin/InquiriesManager";
import { parseSiteInquiryStatus } from "@/lib/site-inquiry-types";
import { listSiteInquiries } from "@/lib/site-inquiries";

export const metadata = { title: "문의 관리" };

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const typeParam = params.type?.trim();
  const statusParam = params.status?.trim();

  const typeFilter =
    typeParam === "survey" || typeParam === "service" ? typeParam : ("all" as const);
  const statusFilter = parseSiteInquiryStatus(statusParam) ?? ("all" as const);

  const { items, error } = await listSiteInquiries({
    type: typeFilter,
    status: statusFilter,
  });

  return (
    <>
      <AdminHeader
        title="문의 관리"
        description="조사·서비스 문의 접수 내역을 확인하고 처리 상태를 관리합니다."
      />
      <div className="p-4 sm:p-6">
        <InquiriesManager
          items={items}
          dbError={error}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
        />
      </div>
    </>
  );
}
