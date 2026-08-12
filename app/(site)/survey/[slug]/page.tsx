import Link from "next/link";
import { notFound } from "next/navigation";
import { AxiSurveyContextBridge } from "@/components/site/AxiSiteContext";
import { CatiStaffSurveySection } from "@/components/site/CatiStaffSurveySection";
import { SurveyParticipantPanel } from "@/components/site/SurveyParticipantPanel";
import { SiteContainer } from "@/components/site/SiteContainer";
import { SurveyScriptCheckButton } from "@/components/site/SurveyScriptCheckButton";
import { hasActiveCatiBatch } from "@/lib/cati-samples";
import { listActiveCatiContactOptions } from "@/lib/cati-contact-options";
import { canUseAxi } from "@/lib/axi/access";
import { getSurveyParticipant } from "@/lib/participant";
import { getSiteHomepageConfig } from "@/lib/site-homepage";
import { loadSurveyResponseScript } from "@/lib/survey-script";
import { getSurveyViewModeForUser } from "@/lib/user-preferences";
import { loadSurveyForParticipation } from "@/lib/survey-public";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadSurveyForParticipation(slug);
  if (!loaded.ok && loaded.reason === "not_found") {
    return { title: "설문을 찾을 수 없음" };
  }
  const title =
    loaded.ok ? loaded.survey.title : loaded.reason === "not_open" ? loaded.title : "설문";
  return {
    title: `${title} | 설문 참여`,
    description: loaded.ok ? loaded.survey.summary || "설문에 참여해 주세요." : undefined,
  };
}

export default async function SurveyParticipatePage({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadSurveyForParticipation(slug);

  if (!loaded.ok && loaded.reason === "not_found") {
    notFound();
  }

  if (!loaded.ok && loaded.reason === "invite_only") {
    return (
      <SiteContainer as="main" width="narrow" className="py-16 sm:py-20">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="font-semibold text-zinc-900">초대 링크로만 참여 가능합니다</h1>
          <p className="mt-2 text-zinc-600">
            「{loaded.title}」은(는) 이메일로 발송된 개인 초대 링크를 통해서만 참여할 수
            있습니다.
          </p>
        </div>
      </SiteContainer>
    );
  }

  if (!loaded.ok && loaded.reason === "not_open") {
    return (
      <SiteContainer as="main" width="narrow" className="py-16 sm:py-20">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="font-semibold text-amber-950">지금은 참여할 수 없습니다</h1>
          <p className="mt-2 font-medium text-amber-900">{loaded.title}</p>
          <ul className="mt-4 space-y-2 text-amber-900/90">
            <li>
              현재 상태: <strong>{loaded.status}</strong>
              {loaded.status === "예정"
                ? " — 설문 기간이 시작되면 참여할 수 있습니다."
                : loaded.status !== "진행중"
                  ? " — 지금은 참여할 수 없습니다."
                  : null}
            </li>
            <li>
              공개 목록:{" "}
              <strong>{loaded.listedPublic ? "표시함" : "숨김"}</strong>
              {!loaded.listedPublic ? " (관리자에서 공개로 설정 필요)" : null}
            </li>
          </ul>
          <p className="mt-4 text-amber-800">
            {loaded.status === "예정"
              ? "예정 설문은 목록에서 확인할 수 있으며, 시작일이 되면 자동으로 진행중으로 전환됩니다."
              : "진행중인 설문만 참여할 수 있습니다. 기간·공개 설정을 확인해 주세요."}
          </p>
          <Link
            href="/surveys"
            className="mt-6 inline-block rounded-xl bg-amber-900 px-5 py-2.5 text-base font-semibold text-white hover:bg-amber-800"
          >
            진행중 설문 목록
          </Link>
        </div>
      </SiteContainer>
    );
  }

  const survey = loaded.survey;
  const redirectedFromSlug =
    "redirectedFromSlug" in loaded ? loaded.redirectedFromSlug : undefined;
  const [participant, homepage] = await Promise.all([
    getSurveyParticipant(),
    getSiteHomepageConfig(),
  ]);
  const catiEnabled = await hasActiveCatiBatch(survey.slug);
  const contactOptions = catiEnabled ? await listActiveCatiContactOptions() : [];
  const viewMode = await getSurveyViewModeForUser(
    participant.mode === "anonymous" ? null : participant.userId,
  );

  const showAxi = canUseAxi(participant, homepage.axiAllowedRoles);
  let axiScriptContext = "";
  if (showAxi) {
    const scriptLoad = await loadSurveyResponseScript(survey.slug);
    if (scriptLoad.ok) {
      const shared = scriptLoad.sharedScripts
        .map((s) => `▸ ${s.title}\n${s.body.trim()}`)
        .join("\n\n");
      axiScriptContext = [
        scriptLoad.responseScript.trim()
          ? `【이 설문 스크립트】\n${scriptLoad.responseScript.trim()}`
          : "",
        shared ? `【공용 스크립트】\n${shared}` : "",
        survey.questions.length > 0
          ? `【문항】\n${survey.questions
              .map((q, i) => `${i + 1}. ${q.prompt}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    } else {
      axiScriptContext = survey.questions
        .map((q, i) => `${i + 1}. ${q.prompt}`)
        .join("\n");
    }
  }

  return (
    <SiteContainer as="main" width="survey" className="py-10 sm:py-12">
      <p>
        <Link href="/surveys" className="font-medium text-accent-600 hover:text-accent-500">
          ← 진행중 설문 목록
        </Link>
      </p>

      <header className="mt-6 border-b border-brand-900/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(1.3125rem,2.7vw,2.125rem)] font-semibold leading-snug tracking-tight text-brand-900">
              {survey.title}
            </h1>
            {survey.summary ? (
              <p className="mt-2 text-brand-700">{survey.summary}</p>
            ) : null}
            {survey.periodLabel ? (
              <p className="mt-2 text-brand-700/80">기간 · {survey.periodLabel}</p>
            ) : null}
          </div>
          {participant.mode === "staff" ? (
            <SurveyScriptCheckButton slug={survey.slug} surveyTitle={survey.title} />
          ) : null}
        </div>
      </header>

      {redirectedFromSlug ? (
        <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          이 설문은 새 버전으로 업데이트되었습니다. 최신 설문으로 연결되었습니다.
        </p>
      ) : null}

      {survey.questions.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          이 설문에는 아직 문항이 없습니다. 관리자에게 문의해 주세요.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <SurveyParticipantPanel
            key={participant.mode}
            slug={survey.slug}
            participant={participant}
          />
          <CatiStaffSurveySection
            slug={survey.slug}
            survey={survey}
            isStaff={participant.mode === "staff"}
            catiEnabled={catiEnabled}
            contactOptions={contactOptions}
            viewMode={viewMode}
          />
        </div>
      )}

      {showAxi ? (
        <AxiSurveyContextBridge
          surveyTitle={survey.title}
          scriptContext={axiScriptContext}
          ksicCode={survey.ksicCode}
          ksicName={survey.ksicName}
        />
      ) : null}
    </SiteContainer>
  );
}
