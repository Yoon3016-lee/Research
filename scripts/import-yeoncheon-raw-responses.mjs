/**
 * 26년 연천군청소년육성재단 청렴만족도 — 나우앤서베이 RAW 응답 임포트
 * 사용: node scripts/import-yeoncheon-raw-responses.mjs [raw-xml-path]
 */
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { loadProjectEnv } from "./lib/load-env.mjs";
import { createSupabaseAdminFromEnv } from "./lib/supabase-admin.mjs";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

loadProjectEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_RAW = join(__dirname, "..", "data", "imports", "yeoncheon-integrity-raw.xml");

const SLUG = "26년-연천군청소년육성재단-청렴만족도-조사-7cba90f1";
const RAW_PATH = process.argv[2]?.trim() || DEFAULT_RAW;

const COL = {
  doneAt: 5,
  complete: 7,
  uid: 8,
  l1: 9,
  l2: 10,
  l3: 11,
  l4: 12,
  l5: 13,
  l6: 14,
  l7: 15,
  l8: 16,
  l9: 17,
  l10: 18,
  l11: 19,
  l12: 20,
  l13: 21,
  l14: 22,
  gender: 23,
  age: 24,
};

const LIKERT_COLS = [
  COL.l1,
  COL.l2,
  COL.l3,
  COL.l4,
  COL.l5,
  COL.l6,
  COL.l7,
  COL.l8,
  COL.l9,
  COL.l10,
  COL.l11,
  COL.l12,
  COL.l13,
  COL.l14,
];

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

function likertMultiAnswer(options, cols, row) {
  /** @type {Record<string, number>} */
  const values = {};
  for (let i = 0; i < cols.length; i++) {
    const v = Number(cell(row, cols[i]));
    if (Number.isInteger(v) && v >= 1 && v <= 5 && options[i]) {
      values[options[i].id] = v;
    }
  }
  return Object.keys(values).length ? { values } : null;
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
  .select("id, question_id, order_index")
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

  add(1, likertMultiAnswer(optsOf(1), LIKERT_COLS, row));
  add(2, mcAnswer(optsOf(2), cell(row, COL.gender)));
  add(3, mcAnswer(optsOf(3), cell(row, COL.age)));

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
}

await admin.from("surveys").update({ response_count: responseCount }).eq("id", survey.id);

console.log(`완료: ${inserted}건 추가, response_count=${responseCount}`);
