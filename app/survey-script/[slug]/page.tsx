import { PopupCloseButton } from "@/components/site/PopupWindowActions";
import { SurveyScriptViewer } from "@/components/site/SurveyScriptViewer";
import { loadSurveyResponseScript } from "@/lib/survey-script";

export const metadata = { title: "Advisor Agent" };

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SurveyScriptPopupPage({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadSurveyResponseScript(slug);

  if (!loaded.ok && loaded.reason === "forbidden") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm font-medium text-zinc-900">접근할 수 없습니다</p>
        <p className="mt-2 max-w-xs text-sm text-zinc-600">
          직원(employee) 이상 계정으로 로그인한 뒤 다시 시도해 주세요.
        </p>
        <PopupCloseButton />
      </main>
    );
  }

  if (!loaded.ok) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm font-medium text-zinc-900">설문을 찾을 수 없습니다</p>
        <PopupCloseButton />
      </main>
    );
  }

  return (
    <SurveyScriptViewer
      title={loaded.title}
      slug={loaded.slug}
      responseScript={loaded.responseScript}
      sharedScripts={loaded.sharedScripts}
    />
  );
}
