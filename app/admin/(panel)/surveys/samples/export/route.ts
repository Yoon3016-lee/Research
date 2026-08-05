import { requireAdminPanelAccess } from "@/lib/require-admin";
import { buildSurveySampleBatchExcel } from "@/lib/survey-samples-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdminPanelAccess();

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() ?? "";
  const batchId = searchParams.get("batchId")?.trim() ?? "";

  if (!slug || !batchId) {
    return new Response("slug·batchId가 필요합니다.", { status: 400 });
  }

  const result = await buildSurveySampleBatchExcel(slug, batchId);
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
