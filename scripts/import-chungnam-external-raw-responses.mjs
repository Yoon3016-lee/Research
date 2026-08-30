/**
 * 1. 2026년 충남도청 외부 청렴도 — 나우앤서베이 RAW 응답 임포트
 * 사용: node scripts/import-chungnam-external-raw-responses.mjs [raw-xml-path]
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
const DEFAULT_RAW = join(
  __dirname,
  "..",
  "data",
  "imports",
  "chungnam-external-integrity-raw.xml",
);

const SLUG = "1-2026년-충남도청-외부-청렴도-806f8943";
const RAW_PATH = process.argv[2]?.trim() || DEFAULT_RAW;

const COL = {
  doneAt: 5,
  complete: 7,
  uid: 8,
  sq2: 9,
  q1: 10,
  q2: 11,
  q3: 12,
  q4: 13,
  q5: 14,
  q6: 15,
  q7: 16,
  q8: 17,
  q9: 18,
  q10: 19,
  q11: 20,
  dq1: 21,
  dq2: 22,
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

function likertMultiAnswer(options, cols, row) {
  /** @type {Record<string, number>} */
  const values = {};
  for (let i = 0; i < cols.length; i++) {
    const v = Number(cell(row, cols[i]));
    if (Number.isInteger(v) && v >= 1 && v <= 7 && options[i]) {
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

  const sq2 = cell(row, COL.sq2);
  add(1, mcAnswer(optsOf(1), sq2));

  const sq2N = Number(sq2);
  if (sq2N !== 1) return out;

  const q1v = Number(cell(row, COL.q1));
  if (Number.isInteger(q1v) && q1v >= 1 && q1v <= 7) add(2, { value: q1v });

  add(
    3,
    likertMultiAnswer(optsOf(3), [COL.q2, COL.q3, COL.q4, COL.q5, COL.q6], row),
  );

  const q7 = cell(row, COL.q7);
  add(4, mcAnswer(optsOf(4), q7));

  const q7N = Number(q7);
  if (Number.isInteger(q7N) && q7N >= 1 && q7N <= 5) {
    add(5, mcAnswer(optsOf(5), cell(row, COL.q8)));

    const q9v = Number(cell(row, COL.q9));
    if (Number.isInteger(q9v) && q9v >= 1 && q9v <= 7) add(6, { value: q9v });
  }

  add(7, mcAnswer(optsOf(7), cell(row, COL.q10)));

  const q11 = cell(row, COL.q11);
  if (q11) add(8, { text: q11 });

  add(9, mcAnswer(optsOf(9), cell(row, COL.dq1)));
  add(10, mcAnswer(optsOf(10), cell(row, COL.dq2)));

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
    console.error("응답 insert fail:", resErr?.message);
    continue;
  }

  const payload = answers.map((a) => ({
    response_id: response.id,
    question_id: a.question_id,
    answer: a.answer,
  }));

  const { error: ansErr } = await admin.from("survey_response_answers").insert(payload);
  if (ansErr) {
    console.error("답변 insert fail:", ansErr.message);
    await admin.from("survey_responses").delete().eq("id", response.id);
    continue;
  }

  responseCount += 1;
  inserted += 1;
}

await admin.from("surveys").update({ response_count: responseCount }).eq("id", survey.id);

console.log(`완료: ${inserted}건 추가, response_count=${responseCount}`);
