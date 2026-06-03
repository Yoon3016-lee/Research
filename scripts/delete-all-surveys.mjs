/**
 * public.surveys 전체 삭제 (문항·응답은 FK cascade)
 * 실행: node scripts/delete-all-surveys.mjs
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

loadEnvFile(envPath);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 필요합니다.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error: listError } = await admin
  .from("surveys")
  .select("id, slug, title");

if (listError) {
  console.error("목록 조회 실패:", listError.message);
  process.exit(1);
}

const count = rows?.length ?? 0;
if (count === 0) {
  console.log("삭제할 설문이 없습니다.");
  process.exit(0);
}

console.log(`삭제 대상 ${count}건:`);
for (const row of rows) {
  console.log(`  - ${row.slug} (${row.title})`);
}

const ids = rows.map((r) => r.id);
const { error: deleteError } = await admin.from("surveys").delete().in("id", ids);

if (deleteError) {
  console.error("삭제 실패:", deleteError.message);
  process.exit(1);
}

const { count: remaining } = await admin
  .from("surveys")
  .select("id", { count: "exact", head: true });

console.log(`완료. 남은 설문: ${remaining ?? 0}건`);
