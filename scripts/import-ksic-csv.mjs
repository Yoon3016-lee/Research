import fs from "fs";
import path from "path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { loadCsvTable } from "./lib/parse-csv.mjs";

const REVISION = 11;
const BATCH = 80;

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref =
    process.env.SUPABASE_PROJECT_REF ??
    projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (password && ref) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

function cell(row, idx, col) {
  const i = idx[col];
  return i == null ? "" : String(row[i] ?? "").trim();
}

function toInt(val) {
  const n = Number.parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

function toBool(val) {
  const v = val.trim().toUpperCase();
  return v === "Y" || v === "TRUE" || v === "1";
}

function findCsv(dir, part) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv") && f.includes(part));
  if (files.length === 0) throw new Error(`data/ksic 에 *${part}*.csv 파일이 없습니다.`);
  return path.join(dir, files[0]);
}

function mapCodeRow(row, idx) {
  const parentCode = cell(row, idx, "parent_code");
  return {
    revision: REVISION,
    sort_order: toInt(cell(row, idx, "sort_order")),
    code: cell(row, idx, "code"),
    level_number: toInt(cell(row, idx, "level_number")),
    level_name: cell(row, idx, "level_name"),
    name_ko: cell(row, idx, "name_ko"),
    name_en: cell(row, idx, "name_en"),
    parent_code: parentCode || null,
    parent_name_ko: cell(row, idx, "parent_name_ko"),
    path_ko: cell(row, idx, "path_ko"),
    path_en: cell(row, idx, "path_en"),
    major_code: cell(row, idx, "major_code"),
    major_name_ko: cell(row, idx, "major_name_ko"),
    middle_code: cell(row, idx, "middle_code"),
    middle_name_ko: cell(row, idx, "middle_name_ko"),
    minor_code: cell(row, idx, "minor_code"),
    minor_name_ko: cell(row, idx, "minor_name_ko"),
    class_code: cell(row, idx, "class_code"),
    class_name_ko: cell(row, idx, "class_name_ko"),
    detail_code: cell(row, idx, "detail_code"),
    detail_name_ko: cell(row, idx, "detail_name_ko"),
    major_code_range: cell(row, idx, "major_code_range"),
    definition: cell(row, idx, "definition"),
    examples: cell(row, idx, "examples"),
    exclusions: cell(row, idx, "exclusions"),
    example_count: toInt(cell(row, idx, "example_count")),
    exclusion_count: toInt(cell(row, idx, "exclusion_count")),
    raw_description: cell(row, idx, "raw_description"),
    ancestor_context: cell(row, idx, "ancestor_context"),
    ai_context: cell(row, idx, "ai_context"),
    child_count: toInt(cell(row, idx, "child_count")),
    has_description: toBool(cell(row, idx, "has_description")),
  };
}

function mapDetailRow(row, idx) {
  return {
    revision: REVISION,
    detail_code: cell(row, idx, "detail_code"),
    detail_name_ko: cell(row, idx, "detail_name_ko"),
    detail_name_en: cell(row, idx, "detail_name_en"),
    major_code: cell(row, idx, "major_code"),
    major_name_ko: cell(row, idx, "major_name_ko"),
    middle_code: cell(row, idx, "middle_code"),
    middle_name_ko: cell(row, idx, "middle_name_ko"),
    minor_code: cell(row, idx, "minor_code"),
    minor_name_ko: cell(row, idx, "minor_name_ko"),
    class_code: cell(row, idx, "class_code"),
    class_name_ko: cell(row, idx, "class_name_ko"),
    path_ko: cell(row, idx, "path_ko"),
    detail_definition: cell(row, idx, "detail_definition"),
    detail_examples: cell(row, idx, "detail_examples"),
    detail_exclusions: cell(row, idx, "detail_exclusions"),
    ancestor_context: cell(row, idx, "ancestor_context"),
    ai_context_for_survey: cell(row, idx, "ai_context_for_survey"),
    major_definition: cell(row, idx, "major_definition"),
    middle_definition: cell(row, idx, "middle_definition"),
    minor_definition: cell(row, idx, "minor_definition"),
    class_definition: cell(row, idx, "class_definition"),
  };
}

const CODE_COLS = [
  "revision",
  "sort_order",
  "code",
  "level_number",
  "level_name",
  "name_ko",
  "name_en",
  "parent_code",
  "parent_name_ko",
  "path_ko",
  "path_en",
  "major_code",
  "major_name_ko",
  "middle_code",
  "middle_name_ko",
  "minor_code",
  "minor_name_ko",
  "class_code",
  "class_name_ko",
  "detail_code",
  "detail_name_ko",
  "major_code_range",
  "definition",
  "examples",
  "exclusions",
  "example_count",
  "exclusion_count",
  "raw_description",
  "ancestor_context",
  "ai_context",
  "child_count",
  "has_description",
];

const DETAIL_COLS = [
  "revision",
  "detail_code",
  "detail_name_ko",
  "detail_name_en",
  "major_code",
  "major_name_ko",
  "middle_code",
  "middle_name_ko",
  "minor_code",
  "minor_name_ko",
  "class_code",
  "class_name_ko",
  "path_ko",
  "detail_definition",
  "detail_examples",
  "detail_exclusions",
  "ancestor_context",
  "ai_context_for_survey",
  "major_definition",
  "middle_definition",
  "minor_definition",
  "class_definition",
];

function buildInsert(table, cols, rows) {
  const placeholders = rows
    .map(
      (_, ri) =>
        `(${cols.map((__, ci) => `$${ri * cols.length + ci + 1}`).join(", ")})`,
    )
    .join(", ");
  const values = rows.flatMap((r) => cols.map((c) => r[c]));
  const sql = `insert into ${table} (${cols.join(", ")}) values ${placeholders}`;
  return { sql, values };
}

async function insertBatches(client, table, cols, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { sql, values } = buildInsert(table, cols, chunk);
    await client.query(sql, values);
    process.stdout.write(`  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ${table}: ${rows.length}건 완료`);
}

async function main() {
  const ksicDir = path.join(root, "data", "ksic");
  const codePath = findCsv(ksicDir, "code_reference");
  const detailPath = findCsv(ksicDir, "detail_reference");

  console.log("CSV:", path.basename(codePath));
  console.log("CSV:", path.basename(detailPath));

  const codeTable = loadCsvTable(codePath);
  const detailTable = loadCsvTable(detailPath);

  const codeRows = codeTable.rows
    .map((r) => mapCodeRow(r, codeTable.idx))
    .filter((r) => r.code)
    .sort((a, b) => a.sort_order - b.sort_order);

  const detailRows = detailTable.rows
    .map((r) => mapDetailRow(r, detailTable.idx))
    .filter((r) => r.detail_code);

  console.log(`파싱: ksic_codes ${codeRows.length}건, ksic_detail_ai ${detailRows.length}건`);

  const codeSet = new Set(codeRows.map((r) => r.code));
  const missingParents = codeRows.filter(
    (r) => r.parent_code && !codeSet.has(r.parent_code),
  );
  if (missingParents.length) {
    throw new Error(`parent_code 무결성 오류: ${missingParents[0].code}`);
  }

  const detailMissing = detailRows.filter((r) => !codeSet.has(r.detail_code));
  if (detailMissing.length) {
    throw new Error(`detail_code 미매칭: ${detailMissing[0].detail_code}`);
  }

  loadEnvFile(envPath);
  const databaseUrl = resolveDatabaseUrl();

  if (databaseUrl) {
    console.log("DB: PostgreSQL 직접 연결");
    await importViaPg(databaseUrl, codeRows, detailRows);
    return;
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("DB: Supabase Service Role upsert");
    await importViaSupabase(codeRows, detailRows);
    return;
  }

  console.error(
    [
      "DB 연결 정보가 없습니다.",
      "",
      "【마이그레이션】 Supabase SQL Editor에서 실행:",
      "  supabase/migrations/20260407400000_ksic_codes.sql",
      "",
      "【import】 .env.local 중 하나 설정 후:",
      "  npm run db:import-ksic",
      "  - SUPABASE_DB_PASSWORD (또는 DATABASE_URL)",
      "  - 또는 SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL",
    ].join("\n"),
  );
  process.exit(1);
}

async function importViaPg(databaseUrl, codeRows, detailRows) {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query("begin");
    await client.query("set constraints all deferred");
    await client.query("delete from public.ksic_detail_ai where revision = $1", [REVISION]);
    await client.query("delete from public.ksic_codes where revision = $1", [REVISION]);

    console.log("insert ksic_codes…");
    await insertBatches(client, "public.ksic_codes", CODE_COLS, codeRows);

    console.log("insert ksic_detail_ai…");
    await insertBatches(client, "public.ksic_detail_ai", DETAIL_COLS, detailRows);

    await client.query("commit");

    const { rows: counts } = await client.query(
      `select
        (select count(*)::int from public.ksic_codes where revision = $1) as codes,
        (select count(*)::int from public.ksic_detail_ai where revision = $1) as details`,
      [REVISION],
    );
    console.log("OK:", counts[0]);
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    await client.end();
  }
}

async function upsertChunks(admin, table, rows, onConflict, chunkSize) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await admin.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
    process.stdout.write(`  ${table}: ${Math.min(i + chunkSize, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ${table}: ${rows.length}건 완료`);
}

async function importViaSupabase(codeRows, detailRows) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.");
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: delDetail } = await admin
    .from("ksic_detail_ai")
    .delete()
    .eq("revision", REVISION);
  if (delDetail) throw new Error(`ksic_detail_ai delete: ${delDetail.message}`);

  const { error: delCodes } = await admin
    .from("ksic_codes")
    .delete()
    .eq("revision", REVISION);
  if (delCodes) throw new Error(`ksic_codes delete: ${delCodes.message}`);

  console.log("upsert ksic_codes…");
  await upsertChunks(admin, "ksic_codes", codeRows, "revision,code", 40);

  console.log("upsert ksic_detail_ai…");
  await upsertChunks(admin, "ksic_detail_ai", detailRows, "revision,detail_code", 8);

  const { count: codes } = await admin
    .from("ksic_codes")
    .select("*", { count: "exact", head: true })
    .eq("revision", REVISION);
  const { count: details } = await admin
    .from("ksic_detail_ai")
    .select("*", { count: "exact", head: true })
    .eq("revision", REVISION);
  console.log("OK:", { codes, details });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
