import { SiteContainer } from "@/components/site/SiteContainer";
import { InquiryForm } from "@/components/site/InquiryForm";
import {
  parseSiteInquiryType,
  SITE_INQUIRY_TYPE_LABELS,
  type SiteInquiryType,
} from "@/lib/site-inquiry-types";

export const metadata = {
  title: "문의하기",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ type?: string }>;
};

function pageTitle(type: SiteInquiryType): string {
  return SITE_INQUIRY_TYPE_LABELS[type];
}

export default async function InquiryPage({ searchParams }: Props) {
  const { type: typeParam } = await searchParams;
  const inquiryType = parseSiteInquiryType(typeParam);

  return (
    <SiteContainer as="main" width="article" className="py-10 sm:py-12 lg:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-sky-800">{pageTitle(inquiryType)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">
          문의 접수
        </h1>
        <p className="mt-3 text-brand-700">
          조사·서비스 관련 문의 내용을 남겨 주시면 담당자가 확인 후 연락드립니다.
        </p>
      </div>

      <div className="site-card mt-8 max-w-2xl p-6 sm:p-8">
        <InquiryForm defaultType={inquiryType} />
      </div>
    </SiteContainer>
  );
}
