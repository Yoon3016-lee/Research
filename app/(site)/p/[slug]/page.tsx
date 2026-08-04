import { notFound } from "next/navigation";
import { SitePageBody } from "@/components/site/SitePageBody";
import {
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
  if (!page) return { title: "페이지를 찾을 수 없음" };
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

  return (
    <main className="w-full">
      <div className="border-b border-brand-900/10 bg-white/80">
        <div className="site-container mx-auto w-full max-w-[var(--site-content-max)] py-5 sm:py-6">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">
            <span className="text-brand-700/70">{trail?.groupLabel ?? "페이지"}</span>
            <span className="mx-2.5 font-medium text-brand-700/35" aria-hidden>
              -
            </span>
            <span>{trail?.itemLabel ?? page.title}</span>
          </h1>
        </div>
      </div>
      <article className="w-full">
        <SitePageBody body={page.body} layout="fullBleed" />
      </article>
    </main>
  );
}
