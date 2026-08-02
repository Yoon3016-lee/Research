/**
 * 충남 청렴도 설문에 나우앤서베이 RAW 응답 임포트 (1회용)
 * node scripts/import-chungnam-raw-responses.mjs
 */
import { loadProjectEnv } from "./lib/load-env.mjs";
import { createSupabaseAdminFromEnv } from "./lib/supabase-admin.mjs";

loadProjectEnv();

const SLUG = "2026년-충남도청-외부-청렴도-169693e3";

/** @type {Array<{ doneAt: string, cells: Record<number, string> }>} */
const ROWS = [
  {
    doneAt: "2026-06-25 10:03:46",
    cells: {
      9: "1",
      10: "1",
      11: "3",
      12: "1",
      13: "7",
      14: "1",
      15: "1",
      16: "1",
      17: "1",
      18: "1",
      19: "6",
      22: "2",
      23: "없음",
    },
  },
  {
    doneAt: "2026-06-25 10:24:12",
    cells: {
      9: "858",
      10: "1",
      11: "2",
      12: "2",
      13: "7",
      14: "7",
      15: "7",
      16: "7",
      17: "7",
      18: "7",
      19: "6",
      22: "2",
      23: "없음",
    },
  },
  {
    doneAt: "2026-06-25 10:26:27",
    cells: {
      9: "531",
      10: "1",
      11: "1",
      12: "1",
      13: "7",
      14: "7",
      15: "7",
      16: "7",
      17: "7",
      18: "7",
      19: "6",
      22: "2",
      23: "없다",
    },
  },
  {
    doneAt: "2026-06-25 10:27:01",
    cells: {
      9: "884",
      10: "1",
      11: "4",
      12: "1",
      13: "7",
      14: "7",
      15: "7",
      16: "7",
      17: "7",
      18: "7",
      19: "6",
      22: "2",
      23: "없음",
    },
  },
  {
    doneAt: "2026-06-25 10:30:04",
    cells: {
      9: "1042",
      10: "1",
      11: "3",
      12: "1",
      13: "7",
      14: "7",
      15: "7",
      16: "7",
      17: "7",
      18: "7",
      19: "6",
      22: "2",
      23: "없음",
    },
  },
  {
    doneAt: "2026-06-25 10:31:14",
    cells: {
      9: "580",
      10: "1",
      11: "3",
      12: "1",
      13: "7",
      14: "7",
      15: "7",
      16: "7",
      17: "7",
      18: "7",
      19: "6",
      22: "2",
      23: "없다",
    },
  },
  {
    doneAt: "2026-06-25 10:34:31",
    cells: {
      9: "694",
      10: "1",
      11: "3",
      12: "1",
      13: "7",
      14: "7",
      15: "7",
      16: "7",
      17: "7",
      18: "7",
      19: "6",
      22: "2",
      23: "없다",
    },
  },
  {
    doneAt: "2026-06-25 10:35:54",
    cells: {
      9: "1170",
      10: "1",
      11: "4",
      12: "2",
      13: "7",
      14: "7",
      15: "7",
      16: "7",
      17: "7",
      18: "7",
      19: "6",
      22: "2",
      23: "없음",
    },
  },
];

function toIso(koreanDt) {
  const m = koreanDt.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!m) return new Date().toISOString();
  return new Date(
    `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}+09:00`,
  ).toISOString();
}

function cell(row, col) {
  return (row.cells[col] ?? "").trim();
}

function mcAnswer(options, oneBased) {
  const n = Number(oneBased);
  if (!Number.isInteger(n) || n < 1) return null;
  const opt = options[n - 1];
  return opt ? { optionId: opt.id } : null;
}

const admin = createSupabaseAdminFromEnv();
if (!admin) {
  console.error("SUPABASE env 필요");
  process.exit(1);
}

const { data: survey, error: sErr } = await admin
  .from("surveys")
  .select("id, slug, response_count")
  .eq("slug", SLUG)
  .maybeSingle();

if (sErr || !survey) {
  console.error("설문 없음:", SLUG);
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

function buildAnswers(row) {
  /** @type {{ question_id: string, answer: Record<string, unknown> }[]} */
  const out = [];

  const add = (order, answer) => {
    const q = byOrder.get(order);
    if (!q || !answer) return;
    out.push({ question_id: q.id, answer });
  };

  const optsOf = (order) => optionsByQ.get(byOrder.get(order)?.id) ?? [];

  // 0 SQ1 UID
  const uid = cell(row, 9);
  if (uid) add(0, { text: uid });

  // 1 SQ2
  add(1, mcAnswer(optsOf(1), cell(row, 10)));

  // 2 DQ1 age
  add(2, mcAnswer(optsOf(2), cell(row, 11)));

  // 3 DQ2 gender
  add(3, mcAnswer(optsOf(3), cell(row, 12)));

  // 4 문1 likert_7
  {
    const v = Number(cell(row, 13));
    if (Number.isInteger(v) && v >= 1 && v <= 7) add(4, { value: v });
  }

  // 5 likert_multi 문2~6 → cols 14~18
  {
    const options = optsOf(5);
    /** @type {Record<string, number>} */
    const values = {};
    for (let i = 0; i < 5; i++) {
      const v = Number(cell(row, 14 + i));
      if (Number.isInteger(v) && v >= 1 && v <= 7 && options[i]) {
        values[options[i].id] = v;
      }
    }
    if (Object.keys(values).length) add(5, { values });
  }

  // 6 문7
  add(6, mcAnswer(optsOf(6), cell(row, 19)));

  // 7 문8
  add(7, mcAnswer(optsOf(7), cell(row, 20)));

  // 8 문9 likert_7
  {
    const v = Number(cell(row, 21));
    if (Number.isInteger(v) && v >= 1 && v <= 7) add(8, { value: v });
  }

  // 9 문10
  add(9, mcAnswer(optsOf(9), cell(row, 22)));

  // 10 문11
  const t = cell(row, 23);
  if (t) add(10, { text: t });

  return out;
}

let inserted = 0;
let responseCount = survey.response_count ?? 0;

for (const row of ROWS) {
  const answers = buildAnswers(row);
  if (!answers.length) continue;

  const { data: response, error: resErr } = await admin
    .from("survey_responses")
    .insert({
      survey_id: survey.id,
      respondent_user_id: null,
      respondent_kind: "guest",
      submitted_at: toIso(row.doneAt),
    })
    .select("id")
    .single();

  if (resErr || !response) {
    console.error("응답 insert 실패:", resErr?.message);
    continue;
  }

  const payload = answers.map((a) => ({
    response_id: response.id,
    question_id: a.question_id,
    answer: a.answer,
  }));

  const { error: ansErr } = await admin
    .from("survey_response_answers")
    .insert(payload);

  if (ansErr) {
    console.error("답변 insert 실패:", ansErr.message);
    await admin.from("survey_responses").delete().eq("id", response.id);
    continue;
  }

  responseCount += 1;
  inserted += 1;
  console.log(
    `  + UID ${cell(row, 9)} → ${answers.length}문항 (${row.doneAt})`,
  );
}

await admin
  .from("surveys")
  .update({ response_count: responseCount })
  .eq("id", survey.id);

console.log(`완료: ${inserted}건 추가, response_count=${responseCount}`);
