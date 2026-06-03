import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteContainer } from "@/components/site/SiteContainer";
import { getPublicSurveyBySlug } from "@/lib/survey-public";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SurveyThanksPage({ params }: Props) {
  const { slug } = await params;
  const survey = await getPublicSurveyBySlug(slug);

  if (!survey) notFound();

  return (
    <SiteContainer as="main" width="narrow" className="py-16 sm:py-20">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-4 font-semibold text-zinc-900">응답이 제출되었습니다</h1>
        <p className="mt-2 text-zinc-600">
          「{survey.title}」 설문에 참여해 주셔서 감사합니다.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/surveys"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            다른 설문 보기
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-base font-medium text-zinc-800 hover:bg-zinc-50"
          >
            홈으로
          </Link>
        </div>
      </div>
    </SiteContainer>
  );
}
