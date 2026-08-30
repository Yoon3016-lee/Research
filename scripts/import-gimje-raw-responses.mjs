/**
 * 김제시 청렴만족도 조사 — 나우앤서베이 RAW 응답 임포트
 * 사용: node scripts/import-gimje-raw-responses.mjs [raw-xml-path]
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
const DEFAULT_RAW = join(__dirname, "..", "data", "imports", "gimje-integrity-raw.xml");

const SLUG = "김제시-청렴만족도-조사-60129e48";
const RAW_PATH = process.argv[2]?.trim() || DEFAULT_RAW;

const COL = {
  doneAt: 5,
  complete: 7,
  uid: 8,
  sq1: 9,
  t1: 10,
  t2: 11,
  t3: 12,
  tReason: 13,
  r1: 14,
  r2: 15,
  r3: 16,
  rReason: 17,
  c1: 18,
  c2: 19,
  c3: 20,
  c4: 21,
  c5: 22,
  cReason: 23,
  corruptExp: 24,
  type1: 25,
  type2: 26,
  type3: 27,
  type4: 28,
  type5: 29,
  typeOther: 30,
  why1: 31,
  why2: 32,
  why3: 33,
  why4: 34,
  why5: 35,
  why6: 36,
  why7: 37,
  why8: 38,
  whyOther: 39,
  amount: 40,
  satisfaction: 41,
  satReason: 42,
  improve: 43,
  dq1: 44,
  age: 45,
  gender: 46,
  field: 47,
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
    if (Number.isInteger(v) && v >= 1 && v <= 5 && options[i]) {
      values[options[i].id] = v;
    }
  }
  return Object.keys(values).length ? { values } : null;
}

function isChecked(raw) {
  const v = String(raw ?? "").trim();
  return v === "1" || v.toLowerCase() === "v";
}

function mcMultiFromColumns(row, optionCols, otherCol, options) {
  const optionIds = [];
  for (let i = 0; i < optionCols.length; i++) {
    if (isChecked(row[optionCols[i]]) && options[i]) {
      optionIds.push(options[i].id);
    }
  }
  if (optionIds.length === 0) return null;

  const otherText = otherCol != null ? cell(row, otherCol) : "";
  const hasOther = options.some((o) => o.is_other && optionIds.includes(o.id));
  if (otherText && hasOther) {
    return { optionIds, otherText };
  }
  return { optionIds };
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

  const sq1 = cell(row, COL.sq1);
  add(1, mcAnswer(optsOf(1), sq1));

  if (sq1 === "2") {
    return out;
  }

  add(2, likertMultiAnswer(optsOf(2), [COL.t1, COL.t2, COL.t3], row));

  const tReason = cell(row, COL.tReason);
  if (tReason) add(3, { text: tReason });

  add(4, likertMultiAnswer(optsOf(4), [COL.r1, COL.r2, COL.r3], row));

  const rReason = cell(row, COL.rReason);
  if (rReason) add(5, { text: rReason });

  add(6, likertMultiAnswer(optsOf(6), [COL.c1, COL.c2, COL.c3, COL.c4, COL.c5], row));

  const cReason = cell(row, COL.cReason);
  if (cReason) add(7, { text: cReason });

  const corrupt = cell(row, COL.corruptExp);
  add(8, mcAnswer(optsOf(8), corrupt));

  if (corrupt === "1") {
    add(
      9,
      mcMultiFromColumns(
        row,
        [COL.type1, COL.type2, COL.type3, COL.type4, COL.type5],
        COL.typeOther,
        optsOf(9),
      ),
    );
    add(
      10,
      mcMultiFromColumns(
        row,
        [COL.why1, COL.why2, COL.why3, COL.why4, COL.why5, COL.why6, COL.why7, COL.why8],
        COL.whyOther,
        optsOf(10),
      ),
    );
    add(11, mcAnswer(optsOf(11), cell(row, COL.amount)));
  }

  add(12, mcAnswer(optsOf(12), cell(row, COL.satisfaction)));

  const satReason = cell(row, COL.satReason);
  if (satReason) add(13, { text: satReason });

  const improve = cell(row, COL.improve);
  if (improve) add(14, { text: improve });

  add(15, mcAnswer(optsOf(15), cell(row, COL.dq1)));
  add(16, mcAnswer(optsOf(16), cell(row, COL.age)));
  add(17, mcAnswer(optsOf(17), cell(row, COL.gender)));
  add(18, mcAnswer(optsOf(18), cell(row, COL.field)));

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
  if (inserted <= 5 || inserted % 100 === 0) {
    console.log(`  + ${inserted}/${rawRows.length} UID ${cell(row, COL.uid)}`);
  }
}

await admin.from("surveys").update({ response_count: responseCount }).eq("id", survey.id);

console.log(`완료: ${inserted}건 추가, response_count=${responseCount}`);
