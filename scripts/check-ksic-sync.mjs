import pg from "pg";
import { KSIC_REVISION, KSURE_SOURCE } from "./lib/data-go-kr-ksure.mjs";
import { printDiffDetail } from "./lib/ksic-external-diff.mjs";
import { loadProjectEnv, resolveDatabaseUrl } from "./lib/load-env.mjs";
import { createSupabaseAdminFromEnv } from "./lib/supabase-admin.mjs";

loadProjectEnv();

function printRunReport(run, codeArg) {
  console.log("최근 동기화");
  console.log(`  상태: ${run.status}`);
  console.log(`  시작: ${run.started_at}`);
  console.log(`  종료: ${run.finished_at ?? "(진행 중)"}`);
  console.log(`  적재: ${run.records_upserted}건`);
  if (run.error_message) console.log(`  오류: ${run.error_message}`);

  const diff = run.diff_summary ?? {};
  console.log("");
  console.log("로컬 KSIC 대비");
  console.log(`  외부 전체: ${diff.externalTotal ?? "?"}`);
  console.log(`  로컬 전체: ${diff.localTotal ?? "?"}`);
  console.log(`  외부에만 있음: ${diff.onlyExternalCount ?? 0}`);
  console.log(`  로컬에만 있음: ${diff.onlyLocalCount ?? 0}`);
  console.log(`  명칭 불일치: ${diff.nameMismatchCount ?? 0}`);

  printDiffDetail(diff, { maxList: 50 });

  return codeArg;
}

async function checkViaPg(databaseUrl, codeArg) {
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows: runs } = await client.query(
      `select id, status, started_at, finished_at, records_upserted, diff_summary, error_message
       from public.ksic_external_sync_runs
       where source = $1
       order by started_at desc
       limit 1`,
      [KSURE_SOURCE],
    );

    if (runs.length === 0) {
      console.log("외부 스냅샷이 없습니다. 먼저 실행: npm run db:sync-ksic-external");
      process.exit(1);
    }

    printRunReport(runs[0], codeArg);

    if (codeArg) {
      const code = codeArg.toUpperCase();
      const { rows: local } = await client.query(
        `select code, name_ko from public.ksic_codes where revision = $1 and code = $2`,
        [KSIC_REVISION, code],
      );
      const { rows: external } = await client.query(
        `select code, name_ko, industry_level, synced_at
         from public.ksic_external_codes
         where revision = $1 and source = $2 and code = $3`,
        [KSIC_REVISION, KSURE_SOURCE, code],
      );

      console.log("");
      console.log(`코드 검증: ${code}`);
      console.log(`  로컬: ${local.length ? `${local[0].name_ko}` : "없음"}`);
      console.log(
        `  외부: ${external.length ? `${external[0].name_ko} (등급 ${external[0].industry_level ?? "?"})` : "없음"}`,
      );
    }
  } finally {
    await client.end();
  }
}

async function checkViaSupabase(codeArg) {
  const admin = createSupabaseAdminFromEnv();
  if (!admin) throw new Error("Supabase admin 클라이언트를 만들 수 없습니다.");

  const { data: runs, error: runErr } = await admin
    .from("ksic_external_sync_runs")
    .select(
      "id, status, started_at, finished_at, records_upserted, diff_summary, error_message",
    )
    .eq("source", KSURE_SOURCE)
    .order("started_at", { ascending: false })
    .limit(1);

  if (runErr) throw new Error(`sync run 조회: ${runErr.message}`);
  if (!runs?.length) {
    console.log("외부 스냅샷이 없습니다. 먼저 실행: npm run db:sync-ksic-external");
    process.exit(1);
  }

  printRunReport(runs[0], codeArg);

  if (codeArg) {
    const code = codeArg.toUpperCase();
    const [{ data: local }, { data: external }] = await Promise.all([
      admin
        .from("ksic_codes")
        .select("code, name_ko")
        .eq("revision", KSIC_REVISION)
        .eq("code", code)
        .maybeSingle(),
      admin
        .from("ksic_external_codes")
        .select("code, name_ko, industry_level, synced_at")
        .eq("revision", KSIC_REVISION)
        .eq("source", KSURE_SOURCE)
        .eq("code", code)
        .maybeSingle(),
    ]);

    console.log("");
    console.log(`코드 검증: ${code}`);
    console.log(`  로컬: ${local ? `${local.name_ko}` : "없음"}`);
    console.log(
      `  외부: ${external ? `${external.name_ko} (등급 ${external.industry_level ?? "?"})` : "없음"}`,
    );
  }
}

async function main() {
  const codeArg = process.argv[2]?.trim();
  const databaseUrl = resolveDatabaseUrl();

  if (databaseUrl) {
    await checkViaPg(databaseUrl, codeArg);
    return;
  }

  if (createSupabaseAdminFromEnv()) {
    await checkViaSupabase(codeArg);
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
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
