/**
 * site_settings 로고 컬럼 추가 (원격 DB)
 *
 * 방법 A — Supabase SQL Editor에 migration SQL 붙여넣기 (권장)
 * 방법 B — .env.local 에 DB 비밀번호 설정 후:
 *   SUPABASE_DB_PASSWORD=대시보드 Database 비밀번호
 *   node scripts/apply-site-logo-migration.mjs
 */
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
    const enc = encodeURIComponent(password);
    return `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;
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
      "【가장 빠른 방법】 Supabase 대시보드 → SQL Editor → 아래 파일 내용 실행:",
      "  supabase/migrations/20260407290000_site_settings_logo.sql",
      "",
      "【CLI】 .env.local 에 추가 후 다시 실행:",
      "  SUPABASE_DB_PASSWORD=프로젝트 Database 비밀번호",
      "  (또는 DATABASE_URL=postgresql://... 전체 URI)",
    ].join("\n"),
  );
  process.exit(1);
}

const sqlPath = path.join(
  root,
  "supabase/migrations/20260407290000_site_settings_logo.sql",
);
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("OK: site_settings 로고 컬럼이 적용되었습니다. 로고 업로드를 다시 시도하세요.");
} catch (err) {
  console.error("마이그레이션 실패:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
