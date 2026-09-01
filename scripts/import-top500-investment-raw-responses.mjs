/**
 * 2026년 하반기 500대 기업 투자계획 조사표 — 나우앤서베이 RAW 응답 임포트
 * 사용: node scripts/import-top500-investment-raw-responses.mjs [raw-xml-path]
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
  "top500-investment-raw.xml",
);

const SLUG = "2026년-하반기-500대-기업-투자계획-조사표-676e57c7";
const RAW_PATH = process.argv[2]?.trim() || DEFAULT_RAW;

const COL = {
  doneAt: 5,
  complete: 7,
  uid: 8,
  industry: 9,
  industryOther: 10,
  q1: 11,
  q1_1: [12, 13, 14, 15, 16, 17, 18, 19],
  q1_1Other: 20,
  q1_2: [21, 22, 23, 24, 25, 26, 27, 28],
  q1_2Other: 29,
  q2: [30, 31, 32, 33, 34, 35],
  q2Other: 36,
  q3: [37, 38, 39, 40, 41, 42],
  q3Other: 43,
  q4: [44, 45, 46, 47, 48, 49, 50],
  q4Other: 51,
  q5: 52,
  q5_1: 53,
  q5_1Other: 54,
  q6: 55,
  q7: [56, 57, 58, 59, 60, 61],
  q7Other: 62,
  q8: [63, 64, 65, 66, 67, 68, 69, 70],
  q8Other: 71,
  q9: 72,
  q9_1: 73,
  q10: [74, 75, 76, 77, 78, 79, 80, 81],
  q10Other: 82,
  contact1: 83,
  contact2: 84,
  contact3: 85,
  contact4: 86,
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

function mcWithOther(row, valueCol, otherCol, options) {
  const ans = mcAnswer(options, cell(row, valueCol));
  if (!ans) return null;
  const otherOpt = options.find((o) => o.is_other);
  if (otherOpt && ans.optionId === otherOpt.id) {
    const otherText = cell(row, otherCol);
    return otherText ? { optionId: ans.optionId, otherText } : ans;
  }
  return ans;
}

function rankFromColumns(row, optionCols, otherCol, options) {
  /** @type {Array<{ optionId: string; rank: number }>} */
  const ranked = [];
  for (let i = 0; i < optionCols.length; i++) {
    const v = Number(cell(row, optionCols[i]));
    if (Number.isInteger(v) && v >= 1 && options[i]) {
      ranked.push({ optionId: options[i].id, rank: v });
    }
  }
  if (ranked.length === 0) return null;
  ranked.sort((a, b) => a.rank - b.rank);
  const rankedOptionIds = ranked.map((r) => r.optionId);
  const otherOpt = options.find((o) => o.is_other);
  const otherText = otherCol != null ? cell(row, otherCol) : "";
  if (otherOpt && rankedOptionIds.includes(otherOpt.id) && otherText) {
    return { rankedOptionIds, otherText };
  }
  return { rankedOptionIds };
}

function contactAnswer(row, cols, options) {
  const values = {};
  for (let i = 0; i < cols.length; i++) {
    const text = cell(row, cols[i]);
    if (text && options[i]) values[options[i].id] = text;
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
  /** @type {{ question_id: string; answer: Record<string, unknown> }[]} */
  const out = [];

  const add = (order, answer) => {
    const q = byOrder.get(order);
    if (!q || !answer) return;
    out.push({ question_id: q.id, answer });
  };

  const uid = cell(row, COL.uid);
  if (uid) add(0, { text: uid });

  add(1, mcWithOther(row, COL.industry, COL.industryOther, optsOf(1)));

  const q1 = cell(row, COL.q1);
  add(2, mcAnswer(optsOf(2), q1));

  if (q1 === "1") {
    add(3, rankFromColumns(row, COL.q1_1, COL.q1_1Other, optsOf(3)));
  }
  if (q1 === "3") {
    add(4, rankFromColumns(row, COL.q1_2, COL.q1_2Other, optsOf(4)));
  }

  add(5, rankFromColumns(row, COL.q2, COL.q2Other, optsOf(5)));
  add(6, rankFromColumns(row, COL.q3, COL.q3Other, optsOf(6)));
  add(7, rankFromColumns(row, COL.q4, COL.q4Other, optsOf(7)));

  const q5 = cell(row, COL.q5);
  add(8, mcAnswer(optsOf(8), q5));

  if (q5 === "1" || q5 === "2") {
    add(9, mcWithOther(row, COL.q5_1, COL.q5_1Other, optsOf(9)));
  }

  const q6v = Number(cell(row, COL.q6));
  if (Number.isInteger(q6v) && q6v >= 1 && q6v <= 10) add(10, { value: q6v });

  add(11, rankFromColumns(row, COL.q7, COL.q7Other, optsOf(11)));
  add(12, rankFromColumns(row, COL.q8, COL.q8Other, optsOf(12)));

  const q9 = cell(row, COL.q9);
  add(13, mcAnswer(optsOf(13), q9));

  if (q9 === "1" || q9 === "2") {
    add(14, mcAnswer(optsOf(14), cell(row, COL.q9_1)));
  }

  add(15, rankFromColumns(row, COL.q10, COL.q10Other, optsOf(15)));
  add(
    16,
    contactAnswer(row, [COL.contact1, COL.contact2, COL.contact3, COL.contact4], optsOf(16)),
  );

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
