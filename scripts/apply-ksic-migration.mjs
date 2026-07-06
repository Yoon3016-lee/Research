import fs from "fs";
import path from "path";
import pg from "pg";

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

loadEnvFile(envPath);

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  console.error(
    [
      "DB 연결 정보가 없습니다.",
      "",
      "Supabase SQL Editor에서 실행:",
      "  supabase/migrations/20260407400000_ksic_codes.sql",
    ].join("\n"),
  );
  process.exit(1);
}

const sqlPath = path.join(root, "supabase/migrations/20260407400000_ksic_codes.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log("OK: ksic_codes / ksic_detail_ai 마이그레이션 적용됨");
} finally {
  await client.end();
}
