/**
 * 2026년 영암군 고객만족도 조사 — 나우앤서베이 RAW 응답 임포트
 * 사용: node scripts/import-yeongam-raw-responses.mjs [raw-xml-path]
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { loadProjectEnv } from "./lib/load-env.mjs";
import { createSupabaseAdminFromEnv } from "./lib/supabase-admin.mjs";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

loadProjectEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_RAW = join(
  __dirname,
  "..",
  "data",
  "imports",
  "yeongam-customer-satisfaction-raw.xml",
);

const SLUG = "2026년-영암군-고객만족도-조사-898977a1";
const RAW_PATH = process.argv[2]?.trim() || DEFAULT_RAW;

/** RAW 열 인덱스 (0-based, RawData 시트) */
const COL = {
  doneAt: 5,
  complete: 7,
  uid: 8,
  q1: 9,
  q2: 10,
  q3: 11,
  q4: 12,
  q5: 13,
  q6: 14,
  q7: 15,
  q8: 16,
  q9Text: 17,
  q10Text: 18,
  gender: 19,
  age: 20,
  name: 21,
  phone: 22,
  minwon: 23,
  minwonOther: 24,
};

function toIso(koreanDt) {
  const raw = String(koreanDt ?? "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return new Date().toISOString();
  return new Date(
    `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}+09:00`,
  ).toISOString();
}

function cell(row, col) {
  const v = row[col];
  if (v == null) return "";
  return String(v).trim();
}

function mcAnswer(options, oneBased) {
  const n = Number(oneBased);
  if (!Number.isInteger(n) || n < 1) return null;
  const opt = options[n - 1];
  return opt ? { optionId: opt.id } : null;
}

function parseRawRows(path) {
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets.RawData ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return rows.slice(3).filter((r) => cell(r, COL.complete) === "완료");
}

const admin = createSupabaseAdminFromEnv();
if (!admin) {
  console.error("SUPABASE env 필요");
  process.exit(1);
}

const { data: survey, error: sErr } = await admin
  .from("surveys")
  .select("id, slug, title, response_count")
  .eq("slug", SLUG)
  .maybeSingle();

if (sErr || !survey) {
  console.error("설문 없음:", SLUG, sErr?.message);
  process.exit(1);
}

const { data: qs } = await admin
  .from("survey_questions")
  .select("id, order_index, question_type")
  .eq("survey_id", survey.id)
  .order("order_index");

const qids = (qs ?? []).map((q) => q.id);
const { data: opts } = await admin
  .from("survey_question_options")
  .select("id, question_id, order_index, is_other")
  .in("question_id", qids)
  .order("order_index");

const optionsByQ = new Map();
for (const o of opts ?? []) {
  const list = optionsByQ.get(o.question_id) ?? [];
  list.push(o);
  optionsByQ.set(o.question_id, list);
}

const byOrder = new Map((qs ?? []).map((q) => [q.order_index, q]));

function optsOf(order) {
  return optionsByQ.get(byOrder.get(order)?.id) ?? [];
}

function buildAnswers(row) {
  /** @type {{ question_id: string, answer: Record<string, unknown> }[]} */
  const out = [];

  const add = (order, answer) => {
    const q = byOrder.get(order);
    if (!q || !answer) return;
    out.push({ question_id: q.id, answer });
  };

  const uid = cell(row, COL.uid);
  if (uid) add(0, { text: uid });

  {
    const options = optsOf(1);
    /** @type {Record<string, number>} */
    const values = {};
    const likertCols = [COL.q1, COL.q2, COL.q3, COL.q4, COL.q5, COL.q6, COL.q7, COL.q8];
    for (let i = 0; i < likertCols.length; i++) {
      const v = Number(cell(row, likertCols[i]));
      if (Number.isInteger(v) && v >= 1 && v <= 5 && options[i]) {
        values[options[i].id] = v;
      }
    }
    if (Object.keys(values).length) add(1, { values });
  }

  const q9 = cell(row, COL.q9Text);
  if (q9) add(2, { text: q9 });

  const q10 = cell(row, COL.q10Text);
  if (q10) add(3, { text: q10 });

  add(4, mcAnswer(optsOf(4), cell(row, COL.gender)));
  add(5, mcAnswer(optsOf(5), cell(row, COL.age)));

  const name = cell(row, COL.name);
  if (name) add(6, { text: name });

  const phone = cell(row, COL.phone);
  if (phone) add(7, { text: phone });

  {
    const minwonIdx = cell(row, COL.minwon);
    const base = mcAnswer(optsOf(8), minwonIdx);
    if (base) {
      const otherText = cell(row, COL.minwonOther);
      const options = optsOf(8);
      const selected = options[Number(minwonIdx) - 1];
      if (selected?.is_other && otherText) {
        add(8, { optionId: base.optionId, otherText });
      } else {
        add(8, base);
      }
    }
  }

  return out;
}

let rawRows;
try {
  rawRows = parseRawRows(RAW_PATH);
} catch (err) {
  console.error("RAW 파일 읽기 실패:", RAW_PATH, err);
  process.exit(1);
}

console.log(`설문: ${survey.title}`);
console.log(`RAW: ${RAW_PATH}`);
console.log(`완료 응답 ${rawRows.length}건 import 시작…`);

let inserted = 0;
let responseCount = survey.response_count ?? 0;

for (const row of rawRows) {
  const answers = buildAnswers(row);
  if (!answers.length) continue;

  const submittedAt = toIso(cell(row, COL.doneAt));

  let insertRow = {
    survey_id: survey.id,
    respondent_user_id: null,
    respondent_kind: "guest",
    submitted_at: submittedAt,
  };

  let { data: response, error: resErr } = await admin
    .from("survey_responses")
    .insert(insertRow)
    .select("id")
    .single();

  if (resErr?.message?.includes("submitted_at")) {
    const retry = await admin
      .from("survey_responses")
      .insert({
        survey_id: survey.id,
        respondent_user_id: null,
        respondent_kind: "guest",
      })
      .select("id")
      .single();
    response = retry.data;
    resErr = retry.error;
  }

  if (resErr || !response) {
    console.error("응답 insert 실패:", resErr?.message);
    continue;
  }

  const payload = answers.map((a) => ({
    response_id: response.id,
    question_id: a.question_id,
    answer: a.answer,
  }));

  const { error: ansErr } = await admin.from("survey_response_answers").insert(payload);
  if (ansErr) {
    console.error("답변 insert 실패:", ansErr.message);
    await admin.from("survey_responses").delete().eq("id", response.id);
    continue;
  }

  responseCount += 1;
  inserted += 1;
  if (inserted <= 5 || inserted % 50 === 0) {
    console.log(`  + ${inserted}/${rawRows.length} UID ${cell(row, COL.uid)}`);
  }
}

await admin.from("surveys").update({ response_count: responseCount }).eq("id", survey.id);

console.log(`완료: ${inserted}건 추가, response_count=${responseCount}`);
