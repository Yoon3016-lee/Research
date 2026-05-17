import Link from "next/link";
import { notFound } from "next/navigation";
import { SurveyParticipantPanel } from "@/components/site/SurveyParticipantPanel";
import { SurveyResponseForm } from "@/components/site/SurveyResponseForm";
import { SurveyScriptCheckButton } from "@/components/site/SurveyScriptCheckButton";
import { getSurveyParticipant } from "@/lib/participant";
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

  if (!loaded.ok && loaded.reason === "not_open") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-amber-950">지금은 참여할 수 없습니다</h1>
          <p className="mt-2 font-medium text-amber-900">{loaded.title}</p>
          <ul className="mt-4 space-y-2 text-sm text-amber-900/90">
            <li>
              현재 상태: <strong>{loaded.status}</strong>
              {loaded.status !== "진행중" ? " (「진행중」이어야 참여 가능)" : null}
            </li>
            <li>
              공개 목록:{" "}
              <strong>{loaded.listedPublic ? "표시함" : "숨김"}</strong>
              {!loaded.listedPublic ? " (관리자에서 공개로 설정 필요)" : null}
            </li>
          </ul>
          <p className="mt-4 text-sm text-amber-800">
            관리자는 설문을 저장할 때 상태를 「진행중」으로, 공개 목록 표시를 켠 뒤 다시
            시도하세요.
          </p>
          <Link
            href="/surveys"
            className="mt-6 inline-block rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
          >
            진행중 설문 목록
          </Link>
        </div>
      </main>
    );
  }

  const survey = loaded.survey;
  const participant = await getSurveyParticipant();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm">
        <Link href="/surveys" className="font-medium text-indigo-700 hover:text-indigo-900">
          ← 진행중 설문 목록
        </Link>
      </p>

      <header className="mt-6 border-b border-zinc-200 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {survey.title}
            </h1>
            {survey.summary ? (
              <p className="mt-2 text-zinc-600">{survey.summary}</p>
            ) : null}
            {survey.periodLabel ? (
              <p className="mt-2 text-sm text-zinc-500">기간 · {survey.periodLabel}</p>
            ) : null}
          </div>
          {participant.mode === "staff" ? (
            <SurveyScriptCheckButton slug={survey.slug} surveyTitle={survey.title} />
          ) : null}
        </div>
      </header>

      {survey.questions.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          이 설문에는 아직 문항이 없습니다. 관리자에게 문의해 주세요.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <SurveyParticipantPanel slug={survey.slug} participant={participant} />
          <SurveyResponseForm survey={survey} />
        </div>
      )}
    </main>
  );
}
