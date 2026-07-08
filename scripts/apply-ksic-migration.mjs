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
