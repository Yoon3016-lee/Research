import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/site/SiteContainer";
import { SurveyResponseForm } from "@/components/site/SurveyResponseForm";
import { loadSurveyForEmailInvite } from "@/lib/survey-public";

type Props = {
  params: Promise<{ slug: string; token: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug, token } = await params;
  const loaded = await loadSurveyForEmailInvite(slug, token);
  if (!loaded.ok) {
    return { title: "설문 참여" };
  }
  return {
    title: `${loaded.survey.title} | 설문 참여`,
    description: loaded.survey.summary || "설문에 참여해 주세요.",
  };
}

export default async function SurveyEmailInvitePage({ params }: Props) {
  const { slug, token } = await params;
  const loaded = await loadSurveyForEmailInvite(slug, token);

  if (loaded.ok) {
    const survey = loaded.survey;
    return (
      <SiteContainer as="main" width="narrow" className="py-10 sm:py-14">
        <header className="mb-8">
          <p className="site-eyebrow">설문 참여</p>
          <h1 className="mt-2 text-2xl font-semibold text-brand-900">{survey.title}</h1>
          {survey.summary ? (
            <p className="mt-2 text-base text-brand-700/90">{survey.summary}</p>
          ) : null}
        </header>
        <SurveyResponseForm
          survey={survey}
          isStaff={false}
          sampleId={loaded.sampleId}
          emailMode
          inviteToken={token}
          viewMode="scroll"
        />
      </SiteContainer>
    );
  }

  if (loaded.reason === "already_responded") {
    return (
      <SiteContainer as="main" width="narrow" className="py-16 sm:py-20">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-semibold text-zinc-900">이미 참여하셨습니다</h1>
          <p className="mt-2 text-zinc-600">
            이 초대 링크로는 이미 설문에 응답하셨습니다. 추가 수정·재접속은 불가능합니다.
          </p>
        </div>
      </SiteContainer>
    );
  }

  if (loaded.reason === "not_open") {
    return (
      <SiteContainer as="main" width="narrow" className="py-16 sm:py-20">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-semibold text-zinc-900">종료된 설문</h1>
          <p className="mt-2 text-zinc-600">
            「{loaded.title}」은(는) 현재 참여할 수 없습니다. (상태: {loaded.status})
          </p>
        </div>
      </SiteContainer>
    );
  }

  notFound();
}
