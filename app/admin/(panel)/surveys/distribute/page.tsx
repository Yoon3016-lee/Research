import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SurveyDistributionPanel } from "@/components/admin/SurveyDistributionPanel";
import {
  buildDefaultDistributeMessage,
  getSurveyParticipateUrl,
} from "@/lib/survey-distribute";
import { loadSurveyForEdit } from "@/lib/surveys-admin";
import { getAdminSurveys } from "@/lib/surveys-db";
import type { SurveyStatus } from "@/lib/survey-list-types";

export const metadata = { title: "배포 관리" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function SurveyDistributePage({ searchParams }: Props) {
  const { slug: slugParam } = await searchParams;
  const slug = slugParam?.trim();

  if (!slug) {
    return (
      <>
        <AdminHeader
          title="배포 관리"
          description="설문 참여 링크가 포함된 초대 문구를 이메일·문자 등으로 보냅니다."
        />
        <div className="p-4 sm:p-6">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            설문 slug가 없습니다.{" "}
            <Link href="/admin/surveys" className="admin-link hover:underline">
              설문 목록
            </Link>
            에서 「배포 관리」를 선택하세요.
          </p>
        </div>
      </>
    );
  }

  const [loaded, adminSurveys, participateUrl] = await Promise.all([
    loadSurveyForEdit(slug),
    getAdminSurveys(),
    getSurveyParticipateUrl(slug),
  ]);

  if (!loaded.ok) {
    if (loaded.reason === "not_configured") {
      return (
        <>
          <AdminHeader title="배포 관리" />
          <div className="p-4 sm:p-6">
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              서버에 <code className="rounded bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>가
              설정되어 있지 않습니다.
            </p>
          </div>
        </>
      );
    }
    notFound();
  }

  const { title } = loaded.bundle;
  const surveyMeta = adminSurveys.find((s) => s.id === slug);
  const status: SurveyStatus = surveyMeta?.status ?? "종료";
  const defaultMessage = buildDefaultDistributeMessage(title, participateUrl);

  return (
    <>
      <AdminHeader
        title="배포 관리"
        description="설문 참여 링크가 포함된 초대 문구를 작성하고, 이메일·문자메시지로 발송합니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <p className="flex flex-wrap items-center gap-4 text-sm text-brand-700">
          <Link href="/admin/surveys" className="admin-link hover:underline">
            ← 설문 목록
          </Link>
          <Link
            href={{
              pathname: "/admin/surveys/edit",
              query: { slug },
            }}
            className="admin-link hover:underline"
          >
            설문 편집
          </Link>
          <Link
            href={{
              pathname: "/admin/surveys/logic",
              query: { slug },
            }}
            className="text-fuchsia-800 hover:underline"
          >
            로직 확인
          </Link>
        </p>

        <SurveyDistributionPanel
          slug={slug}
          title={title}
          status={status}
          participateUrl={participateUrl}
          defaultMessage={defaultMessage}
        />
      </div>
    </>
  );
}
