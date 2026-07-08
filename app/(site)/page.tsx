import Link from "next/link";
import { ArrowRight, ClipboardList, LineChart, Users } from "lucide-react";
import { SiteContainer } from "@/components/site/SiteContainer";
import { HomePopupBanners } from "@/components/site/HomePopupBanners";
import { HomeTopBanner } from "@/components/site/HomeTopBanner";
import { listActiveSiteBanners } from "@/lib/site-banners";
import { getSiteHomepageConfig } from "@/lib/site-homepage";

export default async function HomePage() {
  const [{ siteName, groups }, popupBanners, topBanners] = await Promise.all([
    getSiteHomepageConfig(),
    listActiveSiteBanners("popup"),
    listActiveSiteBanners("top"),
  ]);
  const surveyItems = groups.find((g) => g.key === "survey")?.items ?? [];
  const primarySurveyHref = surveyItems[0]?.href ?? "/surveys";
  const introItems = groups.find((g) => g.key === "intro")?.items ?? [];

  return (
    <main>
      {popupBanners.length > 0 ? <HomePopupBanners banners={popupBanners} /> : null}
      {topBanners.length > 0 ? <HomeTopBanner banners={topBanners} /> : null}
      <section className="relative overflow-hidden border-b border-brand-900/8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_70%_-10%,rgba(196,165,116,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-500/35 to-transparent" />
        <SiteContainer className="relative py-16 sm:py-24 lg:py-28">
          <p className="site-eyebrow">Market Research Platform</p>
          <h1 className="mt-5 max-w-4xl">{siteName}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-700">
            데이터 기반 인사이트와 설문 리서치를 제공합니다. 신뢰할 수 있는 조사 설계부터
            수집·분석까지, 한곳에서 경험하세요.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={primarySurveyHref} className="site-btn-primary">
              설문 참여하기
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {introItems[0] ? (
              <Link href={introItems[0].href} className="site-btn-outline">
                {introItems[0].label}
              </Link>
            ) : null}
          </div>
        </SiteContainer>
      </section>

      <SiteContainer as="section" className="py-14 sm:py-16 lg:py-20">
        <p className="site-eyebrow">Services</p>
        <h2 className="mt-3">리서치 서비스</h2>
        <p className="mt-3 max-w-2xl text-brand-700">
          설계부터 수집·분석까지, 맞춤형 조사 프로젝트를 지원합니다.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-3">
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
            <li key={title} className="site-card group">
              <span className="site-icon-badge">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-700">{desc}</p>
            </li>
          ))}
        </ul>
      </SiteContainer>
    </main>
  );
}
