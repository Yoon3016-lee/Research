import pg from "pg";
import {
  KSIC_REVISION,
  KSURE_SOURCE,
  fetchAllKsureIndustryCodes,
  readDataGoKrServiceKey,
} from "./lib/data-go-kr-ksure.mjs";
import { computeKsicExternalDiff, printSyncSummary } from "./lib/ksic-external-diff.mjs";
import { loadProjectEnv, resolveDatabaseUrl } from "./lib/load-env.mjs";
import { createSupabaseAdminFromEnv } from "./lib/supabase-admin.mjs";

loadProjectEnv();

const serviceKey = readDataGoKrServiceKey();
if (!serviceKey) {
  console.error(
    [
      "DATA_GO_KR_SERVICE_KEY 가 없습니다.",
      "",
      ".env.local 예:",
      "DATA_GO_KR_SERVICE_KEY=공공데이터포털에서_발급한_인증키",
    ].join("\n"),
  );
  process.exit(1);
}

async function fetchApiRecords() {
  console.log("무역보험공사 업종등급목록 API 수집 중…");
  const { records, apiCalls } = await fetchAllKsureIndustryCodes(serviceKey, {
    onProgress: ({ industryLevel, pageNo, fetched, pageItems }) => {
      console.log(
        `  등급 ${industryLevel} · page ${pageNo} · +${pageItems}건 · 누적 고유코드 ${fetched}`,
      );
    },
  });

  if (records.length === 0) {
    throw new Error("API에서 업종 코드를 가져오지 못했습니다. 인증키·응답 형식을 확인하세요.");
  }

  console.log(`수집 완료: 고유 코드 ${records.length}건 · API 호출 ${apiCalls}회`);
  return { records, apiCalls };
}

async function syncViaPg(databaseUrl, records, apiCalls) {
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  let runId = null;

  try {
    const { rows: runRows } = await client.query(
      `insert into public.ksic_external_sync_runs (source, revision, status)
       values ($1, $2, 'running')
       returning id`,
      [KSURE_SOURCE, KSIC_REVISION],
    );
    runId = runRows[0].id;

    await client.query("begin");

    await client.query(
      `delete from public.ksic_external_codes where revision = $1 and source = $2`,
      [KSIC_REVISION, KSURE_SOURCE],
    );

    const batchSize = 200;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values = [];
      const params = [];
      let p = 1;
      for (const row of batch) {
        values.push(
          `($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`,
        );
        params.push(
          KSIC_REVISION,
          KSURE_SOURCE,
          row.code,
          row.nameKo,
          row.industryLevel,
          row.parentCode,
          JSON.stringify(row.raw),
          runId,
        );
      }
      await client.query(
        `insert into public.ksic_external_codes
          (revision, source, code, name_ko, industry_level, parent_code, raw, sync_run_id)
         values ${values.join(", ")}`,
        params,
      );
    }

    const { rows: localRows } = await client.query(
      `select code, name_ko from public.ksic_codes where revision = $1`,
      [KSIC_REVISION],
    );

    const diffSummary = computeKsicExternalDiff(localRows, records);

    await client.query(
      `update public.ksic_external_sync_runs
       set status = 'success',
           finished_at = now(),
           records_fetched = $2,
           records_upserted = $3,
           api_calls = $4,
           diff_summary = $5::jsonb
       where id = $1`,
      [runId, records.length, records.length, apiCalls, JSON.stringify(diffSummary)],
    );

    await client.query("commit");
    printSyncSummary(diffSummary);
  } catch (err) {
    await client.query("rollback").catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    if (runId) {
      await client.query(
        `update public.ksic_external_sync_runs
         set status = 'failed', finished_at = now(), error_message = $2
         where id = $1`,
        [runId, message],
      );
    }
    throw err;
  } finally {
    await client.end();
  }
}

async function fetchAllLocalKsicCodes(admin) {
  const all = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await admin
      .from("ksic_codes")
      .select("code, name_ko")
      .eq("revision", KSIC_REVISION)
      .order("code")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`ksic_codes 조회: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function upsertExternalChunks(admin, rows, runId) {
  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize).map((row) => ({
      revision: KSIC_REVISION,
      source: KSURE_SOURCE,
      code: row.code,
      name_ko: row.nameKo,
      industry_level: row.industryLevel,
      parent_code: row.parentCode,
      raw: row.raw,
      sync_run_id: runId,
    }));
    const { error } = await admin
      .from("ksic_external_codes")
      .upsert(chunk, { onConflict: "revision,source,code" });
    if (error) throw new Error(`ksic_external_codes upsert: ${error.message}`);
    process.stdout.write(
      `  ksic_external_codes: ${Math.min(i + batchSize, rows.length)}/${rows.length}\r`,
    );
  }
  console.log(`  ksic_external_codes: ${rows.length}건 완료`);
}

async function syncViaSupabase(records, apiCalls) {
  const admin = createSupabaseAdminFromEnv();
  if (!admin) {
    throw new Error("Supabase admin 클라이언트를 만들 수 없습니다.");
  }

  const { data: runRow, error: runErr } = await admin
    .from("ksic_external_sync_runs")
    .insert({ source: KSURE_SOURCE, revision: KSIC_REVISION, status: "running" })
    .select("id")
    .single();

  if (runErr || !runRow) {
    throw new Error(`sync run 생성: ${runErr?.message ?? "unknown"}`);
  }

  const runId = runRow.id;

  try {
    const { error: delErr } = await admin
      .from("ksic_external_codes")
      .delete()
      .eq("revision", KSIC_REVISION)
      .eq("source", KSURE_SOURCE);
    if (delErr) throw new Error(`ksic_external_codes delete: ${delErr.message}`);

    await upsertExternalChunks(admin, records, runId);

    const localRows = await fetchAllLocalKsicCodes(admin);
    const diffSummary = computeKsicExternalDiff(localRows, records);

    const { error: updErr } = await admin
      .from("ksic_external_sync_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        records_fetched: records.length,
        records_upserted: records.length,
        api_calls: apiCalls,
        diff_summary: diffSummary,
      })
      .eq("id", runId);

    if (updErr) throw new Error(`sync run 업데이트: ${updErr.message}`);

    printSyncSummary(diffSummary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("ksic_external_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", runId);
    throw err;
  }
}

async function main() {
  const { records, apiCalls } = await fetchApiRecords();
  const databaseUrl = resolveDatabaseUrl();

  if (databaseUrl) {
    console.log("DB: PostgreSQL 직접 연결");
    await syncViaPg(databaseUrl, records, apiCalls);
    return;
  }

  if (createSupabaseAdminFromEnv()) {
    console.log("DB: Supabase Service Role");
    await syncViaSupabase(records, apiCalls);
    return;
  }

  console.error(
    [
      "DB 연결 정보가 없습니다.",
      "",
      ".env.local 중 하나를 설정하세요:",
      "  - SUPABASE_DB_PASSWORD (또는 DATABASE_URL)",
      "  - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
    ].join("\n"),
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("동기화 실패:", err instanceof Error ? err.message : err);
  process.exit(1);
});
