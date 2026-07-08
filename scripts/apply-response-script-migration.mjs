/**
 * surveys.response_script 컬럼 추가 (원격 DB)
 *
 * 방법 A — Supabase SQL Editor에 migration SQL 붙여넣기 (권장, 비밀번호 불필요)
 * 방법 B — .env.local 에 DB 비밀번호 설정 후:
 *   SUPABASE_DB_PASSWORD=대시보드 Database 비밀번호
 *   npm run db:migrate-response-script
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { loadProjectEnv, resolveDatabaseUrl } from "./lib/load-env.mjs";

loadProjectEnv();

const root = process.cwd();
const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  console.error(
    [
      "DB 연결 정보가 없습니다.",
      "",
      "【가장 빠른 방법】 Supabase 대시보드 → SQL Editor → 아래 파일 내용 실행:",
      "  supabase/migrations/20260407200000_survey_response_script.sql",
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
  "supabase/migrations/20260407200000_survey_response_script.sql",
);
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("OK: response_script 컬럼이 적용되었습니다. 설문 저장을 다시 시도하세요.");
} catch (err) {
  console.error("마이그레이션 실패:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
