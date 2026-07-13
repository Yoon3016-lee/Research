import Link from "next/link";
import { SiteContainer } from "@/components/site/SiteContainer";
import { MyPageSettings } from "@/components/site/MyPageSettings";
import { getSurveyParticipant } from "@/lib/participant";
import { getSurveyViewModeForUser } from "@/lib/user-preferences";

export const metadata = { title: "마이페이지" };

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const participant = await getSurveyParticipant();

  if (participant.mode === "anonymous") {
    return (
      <SiteContainer as="main" width="narrow" className="py-16 sm:py-20">
        <div className="site-card p-8 text-center">
          <h1 className="font-semibold text-brand-900">로그인이 필요합니다</h1>
          <p className="mt-2 text-brand-700">
            마이페이지는 로그인 후 이용할 수 있습니다. 우측 상단에서 로그인해 주세요.
          </p>
          <Link href="/surveys" className="mt-6 inline-block site-btn-primary px-5 py-2.5 text-sm">
            진행중 설문 보기
          </Link>
        </div>
      </SiteContainer>
    );
  }

  const roleLabel = participant.mode === "staff" ? participant.roleLabel : "게스트 계정";
  const viewMode = await getSurveyViewModeForUser(participant.userId);

  return (
    <SiteContainer as="main" width="narrow" className="py-10 sm:py-12">
      <header className="border-b border-brand-900/10 pb-5">
        <h1 className="font-semibold text-brand-900">마이페이지</h1>
        <p className="mt-2 text-brand-700">
          계정 정보 확인, 설문 진행 방식 설정, 비밀번호 변경을 할 수 있습니다.
        </p>
      </header>
      <div className="mt-6">
        <MyPageSettings
          email={participant.email}
          roleLabel={roleLabel}
          initialViewMode={viewMode}
        />
      </div>
    </SiteContainer>
  );
}
