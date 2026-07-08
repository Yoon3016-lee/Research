import { exportSurveyResponsesXlsx } from "@/lib/survey-response-export";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdminPanelAccess();

  const survey = new URL(request.url).searchParams.get("survey")?.trim() ?? "";
  if (!survey) {
    return new Response("survey 파라미터가 필요합니다.", { status: 400 });
  }

  const result = await exportSurveyResponsesXlsx(survey);

  if (!result.ok) {
    if (result.reason === "not_configured") {
      return new Response("서버 설정이 완료되지 않았습니다.", { status: 503 });
    }
    return new Response("설문을 찾을 수 없습니다.", { status: 404 });
  }

  return new Response(result.buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(result.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}
