import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SurveyThanksContent } from "@/components/site/SurveyThanksContent";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { normalizeSurveyRef } from "@/lib/survey-slug";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const title = await loadSurveyTitle(slug);
  return { title: title ? `${title} | 감사합니다` : "감사합니다" };
}

async function loadSurveyTitle(slug: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const normalized = normalizeSurveyRef(slug);
  if (!normalized) return null;
  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin.from("surveys").select("title").eq("slug", normalized).maybeSingle();
  return (data?.title as string | undefined) ?? null;
}

export default async function SurveyThanksPage({ params }: Props) {
  const { slug } = await params;
  const title = await loadSurveyTitle(slug);
  if (!title) notFound();

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-600">로딩 중…</main>
      }
    >
      <SurveyThanksContent slug={slug} title={title} />
    </Suspense>
  );
}
