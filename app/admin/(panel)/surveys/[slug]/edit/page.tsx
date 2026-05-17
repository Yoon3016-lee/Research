import { redirect } from "next/navigation";
import { normalizeSurveyRef } from "@/lib/survey-slug";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

/** 경로형 URL → 쿼리형 편집 페이지로 통일 (한글 slug·이중 인코딩 대응) */
export default async function EditSurveyPathRedirectPage({ params }: Props) {
  const { slug } = await params;
  const normalized = normalizeSurveyRef(slug);
  if (!normalized) {
    redirect("/admin/surveys/edit");
  }
  redirect(`/admin/surveys/edit?slug=${encodeURIComponent(normalized)}`);
}
