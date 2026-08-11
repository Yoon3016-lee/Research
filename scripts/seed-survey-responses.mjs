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

function clampInt(n, min, max) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function toAnswerJson(q, profile, qIndex) {
  const type = q.question_type;
  const options = q.options;
  const scaleSize = clampInt(q.max_selections ?? 5, 2, 10);

  if (type === "info_media") {
    return null;
  }
  if (type === "mc_single" || type === "dropdown") {
    const opt = pick(options, profile[qIndex] ?? 0);
    return opt ? { optionId: opt.id } : null;
  }
  if (type === "mc_multi") {
    const max = q.max_selections ?? 4;
    const raw = profile[qIndex];
    const indices = Array.isArray(raw)
      ? raw
      : typeof raw === "number"
        ? [raw, raw + 1, raw + 2]
        : [0, 1];
    const ids = [...new Set(indices)]
      .slice(0, max)
      .map((i) => options[Math.abs(i) % Math.max(options.length, 1)]?.id)
      .filter(Boolean);
    return ids.length ? { optionIds: ids } : null;
  }
  if (type === "likert_7") {
    const raw = profile[qIndex];
    const value =
      typeof raw === "number"
        ? clampInt(raw + 1, 1, scaleSize)
        : clampInt((qIndex % scaleSize) + 1, 1, scaleSize);
    return { value };
  }
  if (type === "text_single") {
    const samples = [
      "원재료·임대료 부담이 커졌습니다.",
      "인력 채용과 인건비 관리가 어렵습니다.",
      "배달 수수료와 경쟁 심화가 부담입니다.",
      "단골 확보와 재방문율 개선이 필요합니다.",
      "운영 시간을 줄이고 효율을 높이고 있습니다.",
    ];
    return { text: pick(samples, profile[qIndex] ?? 0) };
  }
  if (type === "text_multi") {
    if (options.length > 0) {
      const values = {};
      for (let i = 0; i < options.length; i++) {
        values[options[i].id] = `항목 ${i + 1} 응답 예시`;
      }
      return { values };
    }
    return { lines: ["첫 번째 의견", "두 번째 의견"] };
  }
  if (type === "rank") {
    const ids = options.map((o) => o.id).filter(Boolean);
    const rankCount = clampInt(q.max_selections ?? Math.min(3, ids.length), 1, ids.length || 1);
    const shift = typeof profile[qIndex] === "number" ? profile[qIndex] : 0;
    const rotated = [...ids.slice(shift % ids.length), ...ids.slice(0, shift % ids.length)];
    const ranked = rotated.slice(0, rankCount);
    return ranked.length ? { rankedOptionIds: ranked } : null;
  }
  if (type === "likert_multi") {
    const values = {};
    const base =
      typeof profile[qIndex] === "number" ? profile[qIndex] : qIndex % scaleSize;
    for (let i = 0; i < options.length; i++) {
      values[options[i].id] = clampInt(((base + i) % scaleSize) + 1, 1, scaleSize);
    }
    return Object.keys(values).length ? { values } : null;
  }
  if (type === "star_rating") {
    const stars = [2, 2.5, 3, 3.5, 4, 4.5, 5];
    return { value: pick(stars, profile[qIndex] ?? 0) };
  }
  if (type === "contact_fields") {
    const samples = [
      { name: "김민수", phone: "010-1234-5678", dept: "본점" },
      { name: "이서연", phone: "010-2345-6789", dept: "운영팀" },
      { name: "박준호", phone: "010-3456-7890", dept: "매장관리" },
      { name: "최유진", phone: "010-4567-8901", dept: "카페" },
      { name: "정하늘", phone: "010-5678-9012", dept: "영업" },
    ];
    const s = pick(samples, profile[qIndex] ?? 0);
    const values = {};
    for (const opt of options) {
      const label = (opt.label ?? "").toLowerCase();
      if (label.includes("연락") || label.includes("전화") || label.includes("휴대폰")) {
        values[opt.id] = s.phone;
      } else if (label.includes("이름") || label.includes("성명")) {
        values[opt.id] = s.name;
      } else {
        values[opt.id] = s.dept;
      }
    }
    return Object.keys(values).length ? { values } : null;
  }
  return null;
}

/** 응답 패턴 (문항 순서별 인덱스·배열 또는 척도 0-based) */
const PROFILES = [
  [0, 0, 1, 2, [0, 2, 4], 0, 3, 1, 2, 0, [0, 1, 2], 4, 0, 2, 3, 0, 1, 0, 0],
  [0, 1, 2, 3, [1, 3, 5], 1, 4, 2, 1, 1, [1, 2], 3, 1, 3, 5, 1, 2, 0, 1],
  [0, 2, 0, 1, [0, 1, 3], 2, 2, 0, 3, 0, [0, 3, 4], 2, 0, 1, 4, 2, 0, 0, 2],
  [0, 3, 3, 4, [2, 4, 6], 3, 1, 3, 0, 1, [2, 3], 5, 1, 0, 6, 3, 1, 0, 3],
  [0, 0, 4, 0, [0, 5, 7], 4, 5, 4, 4, 0, [0, 1, 4], 1, 0, 4, 2, 4, 2, 0, 4],
  [0, 1, 1, 5, [1, 2, 3], 0, 3, 5, 2, 1, [1, 4], 4, 1, 2, 3, 0, 3, 0, 0],
  [0, 2, 2, 2, [0, 3, 4], 1, 4, 6, 1, 0, [0, 2], 3, 0, 3, 5, 1, 4, 0, 1],
  [0, 3, 0, 3, [2, 5, 6], 2, 2, 7, 3, 1, [2, 3, 4], 2, 1, 1, 4, 2, 0, 0, 2],
  [0, 0, 3, 1, [0, 1, 7], 3, 1, 0, 0, 0, [0, 1, 3], 5, 0, 0, 6, 3, 1, 0, 3],
  [0, 1, 4, 4, [1, 4, 5], 4, 5, 1, 4, 1, [1, 2, 4], 1, 1, 4, 2, 4, 2, 0, 4],
  [0, 2, 1, 2, [0, 2, 3], 0, 3, 2, 2, 0, [0, 2], 4, 0, 2, 3, 0, 3, 0, 0],
  [0, 3, 2, 5, [3, 4, 6], 1, 4, 3, 1, 1, [3, 4], 3, 1, 3, 5, 1, 4, 0, 1],
  [0, 0, 0, 0, [0, 1, 2], 2, 2, 4, 3, 0, [0, 1], 2, 0, 1, 4, 2, 0, 0, 2],
  [0, 1, 3, 3, [1, 5, 7], 3, 1, 5, 0, 1, [1, 3, 4], 5, 1, 0, 6, 3, 1, 0, 3],
  [0, 2, 4, 1, [2, 3, 5], 4, 5, 6, 4, 0, [0, 4], 1, 0, 4, 2, 4, 2, 0, 4],
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
