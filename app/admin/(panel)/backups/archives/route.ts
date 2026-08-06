import { exportSurveyArchivesJson } from "@/lib/survey-response-backup";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdminPanelAccess();

  const survey = new URL(request.url).searchParams.get("survey")?.trim() ?? "";
  if (!survey) {
    return new Response("survey 파라미터가 필요합니다.", { status: 400 });
  }

  const result = await exportSurveyArchivesJson(survey);
  if (!result.ok) {
    return new Response(result.error, { status: 404 });
  }

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(result.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}
