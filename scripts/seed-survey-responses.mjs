/**
 * 설문 테스트 응답 시드
 * 사용: node scripts/seed-survey-responses.mjs <slug> [건수]
 */
import { loadProjectEnv } from "./lib/load-env.mjs";
import { createSupabaseAdminFromEnv } from "./lib/supabase-admin.mjs";

loadProjectEnv();

const slug = process.argv[2]?.trim();
const count = Math.max(1, Math.min(100, Number(process.argv[3]) || 10));

if (!slug) {
  console.error("사용법: node scripts/seed-survey-responses.mjs <slug> [건수]");
  process.exit(1);
}

const admin = createSupabaseAdminFromEnv();
if (!admin) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}

function pick(arr, index) {
  return arr[Math.min(index, arr.length - 1)];
}

function toAnswerJson(q, profile, qIndex) {
  const type = q.question_type;
  const options = q.options;

  if (type === "mc_single" || type === "dropdown") {
    const opt = pick(options, profile[qIndex] ?? 0);
    return opt ? { optionId: opt.id } : null;
  }
  if (type === "mc_multi") {
    const max = q.max_selections ?? 4;
    const indices = profile[qIndex] ?? [0, 1];
    const ids = [...new Set(indices)]
      .slice(0, max)
      .map((i) => options[i]?.id)
      .filter(Boolean);
    return ids.length ? { optionIds: ids } : null;
  }
  if (type === "likert_7") {
    const value = (profile[qIndex] ?? 3) + 1;
    if (value < 1 || value > 7) return { value: 4 };
    return { value };
  }
  if (type === "text_single") {
    const samples = [
      "어촌에서 20년째 어업을 하고 있습니다.",
      "가족과 함께 어업을 이어가고 있습니다.",
      "최근 비용 부담이 커졌습니다.",
    ];
    return { text: pick(samples, profile[qIndex] ?? 0) };
  }
  if (type === "text_multi") {
    return { lines: ["첫 번째 의견", "두 번째 의견"] };
  }
  if (type === "rank") {
    const ids = options.map((o) => o.id).filter(Boolean);
    const shift = profile[qIndex] ?? 0;
    const ranked = [...ids.slice(shift), ...ids.slice(0, shift)];
    return ranked.length ? { rankedOptionIds: ranked } : null;
  }
  if (type === "likert_multi") {
    const values = {};
    for (const opt of options) {
      values[opt.id] = ((profile[qIndex] ?? 0) % 7) + 1;
    }
    return Object.keys(values).length ? { values } : null;
  }
  if (type === "star_rating") {
    const stars = [2, 2.5, 3, 3.5, 4, 4.5, 5];
    return { value: pick(stars, profile[qIndex] ?? 0) };
  }
  return null;
}

/** 응답 패턴 (문항 순서별 인덱스 또는 likert 0~6) */
const PROFILES = [
  [0, 4, 0, 1, 5, 1, 3, [0, 2, 4], 0],
  [0, 5, 1, 2, 6, 0, 4, [1, 3, 5], 1],
  [0, 3, 2, 3, 4, 2, 2, [0, 1, 2, 3], 2],
  [0, 6, 3, 4, 3, 1, 5, [2, 4, 6], 3],
  [1, 2, 0, 0, 2, 3, 1, [0, 5], 4],
  [0, 1, 4, 1, 5, 0, 6, [1, 2, 3, 4], 5],
  [0, 4, 1, 2, 6, 1, 4, [0, 3, 5], 0],
  [0, 5, 2, 3, 5, 2, 3, [2, 3, 4], 1],
  [0, 3, 3, 4, 4, 3, 2, [0, 1, 6], 6],
  [0, 6, 0, 0, 6, 0, 5, [4, 5, 6], 2],
  [0, 2, 1, 1, 3, 1, 4, [0, 2], 3],
  [0, 4, 4, 2, 5, 2, 3, [1, 3, 5, 6], 4],
  [0, 5, 0, 3, 4, 1, 6, [0, 1, 2], 5],
  [0, 3, 2, 4, 3, 0, 1, [2, 4], 1],
  [0, 6, 1, 2, 6, 3, 5, [3, 4, 5, 6], 0],
];

const { data: survey, error: sErr } = await admin
  .from("surveys")
  .select("id, slug, title, response_count")
  .eq("slug", slug)
  .maybeSingle();

if (sErr || !survey) {
  console.error("설문을 찾을 수 없습니다:", slug);
  process.exit(1);
}

const { data: questionRows } = await admin
  .from("survey_questions")
  .select("id, order_index, question_type, max_selections, allow_skip, staff_only")
  .eq("survey_id", survey.id)
  .order("order_index");

const questions = (questionRows ?? []).filter((q) => !q.staff_only);
const qids = questions.map((q) => q.id);

const { data: optionRows } = await admin
  .from("survey_question_options")
  .select("id, question_id, order_index, label")
  .in("question_id", qids)
  .order("order_index");

const optionsByQuestion = new Map();
for (const o of optionRows ?? []) {
  const list = optionsByQuestion.get(o.question_id) ?? [];
  list.push(o);
  optionsByQuestion.set(o.question_id, list);
}

for (const q of questions) {
  q.options = optionsByQuestion.get(q.id) ?? [];
}

let inserted = 0;
let responseCount = survey.response_count ?? 0;

for (let i = 0; i < count; i++) {
  const profile = PROFILES[i % PROFILES.length];

  const { data: response, error: resErr } = await admin
    .from("survey_responses")
    .insert({
      survey_id: survey.id,
      respondent_user_id: null,
      respondent_kind: "guest",
    })
    .select("id")
    .single();

  if (resErr || !response) {
    console.error("응답 insert 실패:", resErr?.message);
    continue;
  }

  const answerRows = [];
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const json = toAnswerJson(q, profile, qi);
    if (json) {
      answerRows.push({
        response_id: response.id,
        question_id: q.id,
        answer: json,
      });
    }
  }

  if (answerRows.length > 0) {
    const { error: ansErr } = await admin.from("survey_response_answers").insert(answerRows);
    if (ansErr) {
      console.error("답변 insert 실패:", ansErr.message);
      continue;
    }
  }

  responseCount += 1;
  inserted += 1;
}

await admin.from("surveys").update({ response_count: responseCount }).eq("id", survey.id);

console.log(`완료: "${survey.title}"`);
console.log(`  slug: ${survey.slug}`);
console.log(`  새로 추가: ${inserted}건`);
console.log(`  총 response_count: ${responseCount}`);
