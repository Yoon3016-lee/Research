import Link from "next/link";
import { ArrowRight, ClipboardList, LineChart, Users } from "lucide-react";
import { HomePopupBanners } from "@/components/site/HomePopupBanners";
import { listActiveSiteBanners } from "@/lib/site-banners";
import { getSiteHomepageConfig } from "@/lib/site-homepage";

export default async function HomePage() {
  const [{ siteName, groups }, banners] = await Promise.all([
    getSiteHomepageConfig(),
    listActiveSiteBanners(),
  ]);
  const surveyItems = groups.find((g) => g.key === "survey")?.items ?? [];
  const primarySurveyHref = surveyItems[0]?.href ?? "/surveys";
  const introItems = groups.find((g) => g.key === "intro")?.items ?? [];

  return (
    <main>
      <HomePopupBanners banners={banners} />
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.14),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-medium tracking-wide text-blue-700">Market Research</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {siteName}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            데이터 기반 인사이트와 설문 리서치를 제공합니다. 상단 메뉴에서 회사 소개, 설문
            참여, 서비스 안내를 확인하세요.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={primarySurveyHref}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              설문 참여하기
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {introItems[0] ? (
              <Link
                href={introItems[0].href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                {introItems[0].label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-900">리서치 서비스</h2>
        <p className="mt-1 text-sm text-slate-600">
          설계부터 수집·분석까지, 맞춤형 조사 프로젝트를 지원합니다.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "설문 설계·배포",
              desc: "온라인 설문 제작, 타깃 모집, 실시간 응답 모니터링을 지원합니다.",
              icon: ClipboardList,
            },
            {
              title: "정량·정성 분석",
              desc: "통계 분석과 인터뷰·FGI 등 정성 리서치를 결합한 인사이트를 제공합니다.",
              icon: LineChart,
            },
            {
              title: "기업·기관 파트너십",
              desc: "브랜드·제품·정책 조사 등 B2B·공공 분야 프로젝트 경험을 보유하고 있습니다.",
              icon: Users,
            },
          ].map(({ title, desc, icon: Icon }) => (
            <li
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
