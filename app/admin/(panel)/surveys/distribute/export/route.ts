import { buildEmailDistributionStatusExcel } from "@/lib/survey-email-admin";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdminPanelAccess();

  const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return new Response("slug가 필요합니다.", { status: 400 });
  }

  const result = await buildEmailDistributionStatusExcel(slug);
  if (!result.ok) {
    return new Response(result.error, { status: 400 });
  }

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
