import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/site/SiteContainer";
import { SitePageBody } from "@/components/site/SitePageBody";
import {
  findSiteNavGuideMatch,
  findSiteNavTrailForPage,
  getSiteHomepageConfig,
  getSitePageBySlug,
} from "@/lib/site-homepage";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getSitePageBySlug(slug);
  if (!page) return { title: "페이지를 찾을 수 없음", robots: { index: false, follow: false } };
  return { title: page.title };
}

export default async function SiteCmsPage({ params }: Props) {
  const { slug } = await params;
  const [page, homepage] = await Promise.all([
    getSitePageBySlug(slug),
    getSiteHomepageConfig(),
  ]);

  if (!page) {
    notFound();
  }

  const trail = findSiteNavTrailForPage(homepage.groups, page);
  const guideMatch = findSiteNavGuideMatch(homepage.groups, `/p/${page.slug}`);
  const title = trail?.itemLabel ?? page.title;

  return (
    <SiteContainer
      as="main"
      width="page"
      className={
        guideMatch
          ? "pb-10 pt-0 sm:pb-12 lg:pb-14"
          : "py-10 sm:py-12 lg:py-14"
      }
    >
      {!guideMatch ? (
        <header className="border-b border-brand-900/10 pb-5 sm:pb-6">
          <h1 className="text-[2.25rem] font-semibold leading-tight tracking-tight text-brand-900 sm:text-[2.8125rem]">
            {title}
          </h1>
        </header>
      ) : (
        <h1 className="sr-only">{title}</h1>
      )}
      <article className={guideMatch ? undefined : "mt-8"}>
        <SitePageBody body={page.body} />
      </article>
    </SiteContainer>
  );
}
