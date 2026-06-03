import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/site/SiteContainer";
import { SitePageBody } from "@/components/site/SitePageBody";
import { getSitePageBySlug } from "@/lib/site-homepage";

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
  const page = await getSitePageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <SiteContainer as="main" width="article" className="py-12 sm:py-14">
      <nav className="mb-6 text-slate-500">
        <Link href="/" className="hover:text-slate-800">
          홈
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{page.title}</span>
      </nav>
      <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{page.title}</h1>
        <div className="mt-8 max-w-none">
          <SitePageBody body={page.body} />
        </div>
      </article>
    </SiteContainer>
  );
}
