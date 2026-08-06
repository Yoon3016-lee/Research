import { getSurveyBackupPayload } from "@/lib/survey-response-backup";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdminPanelAccess();

  const backupId = new URL(request.url).searchParams.get("backup")?.trim() ?? "";
  if (!backupId) {
    return new Response("backup 파라미터가 필요합니다.", { status: 400 });
  }

  const result = await getSurveyBackupPayload(backupId);
  if (!result.ok) {
    return new Response("백업을 찾을 수 없습니다.", { status: 404 });
  }

  const body = JSON.stringify(result.payload, null, 2);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(result.filename)}"`,
      "Cache-Control": "no-store",
    },
  });
}
