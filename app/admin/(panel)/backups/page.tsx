import { AdminHeader } from "@/components/admin/AdminHeader";
import { ResponseBackupsPanel } from "@/components/admin/ResponseBackupsPanel";
import {
  listSurveyBackupSummaries,
  listSurveyBackupsForSurvey,
} from "@/lib/survey-response-backup";

export const metadata = { title: "응답 백업" };

export const dynamic = "force-dynamic";

export default async function AdminBackupsPage() {
  const summaries = await listSurveyBackupSummaries();

  const backupsBySurvey: Record<string, Awaited<ReturnType<typeof listSurveyBackupsForSurvey>>> =
    {};
  for (const s of summaries) {
    backupsBySurvey[s.surveyId] = await listSurveyBackupsForSurvey(s.surveySlug);
  }

  return (
    <>
      <AdminHeader
        title="응답 백업"
        description="설문 응답 제출 아카이브와 전체 스냅샷을 관리합니다. 운영 데이터 유실 시 복구용으로 사용하세요."
      />
      <div className="p-4 sm:p-6">
        <ResponseBackupsPanel summaries={summaries} backupsBySurvey={backupsBySurvey} />
      </div>
    </>
  );
}
