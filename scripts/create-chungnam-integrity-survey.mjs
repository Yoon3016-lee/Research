/**
 * 2026년 충남도청 외부 청렴도 설문 생성
 * 사용: node scripts/create-chungnam-integrity-survey.mjs
 */
import { randomUUID } from "crypto";
import { loadProjectEnv } from "./lib/load-env.mjs";
import { createSupabaseAdminFromEnv } from "./lib/supabase-admin.mjs";

loadProjectEnv();

function toDateOnlyString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateOnlyString(date);
}

function cid() {
  return randomUUID();
}

const today = toDateOnlyString();
const periodStart = today;
const periodEnd = addDays(today, 90);
const periodLabel = `${periodStart.replace(/-/g, ".")} — ${periodEnd.replace(/-/g, ".")}`;

/** @type {Array<Record<string, unknown>>} */
const questions = [
  {
    clientId: cid(),
    type: "text_single",
    prompt: "SQ1. UID",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [],
    options: [],
  },
  {
    clientId: cid(),
    type: "mc_single",
    prompt:
      "SQ2. 선생님께서는 2025년 7월부터 2026년 5월 말까지 1년간 충청남도 공무원(직원)과 업무를 보신 적이 있습니까?",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [],
    options: ["예 ☞ 조사진행", "아니오 ☞ 조사종료"],
  },
  {
    clientId: cid(),
    type: "mc_single",
    prompt: "DQ1. 선생님의 연령은 어떻게 되십니까?",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: ["20대", "30대", "40대", "50대", "60세 이상"],
  },
  {
    clientId: cid(),
    type: "mc_single",
    prompt: "DQ2. 선생님의 성별 (목소리로 파악)",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: ["남성", "여성"],
  },
  {
    clientId: cid(),
    type: "likert_7",
    prompt:
      "Section A. 부패인식\n\n문1. 충청남도의 업무를 처리하는 기준이나 절차가 투명하게 공개되어 있다고 생각하십니까?",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: ["전혀 그렇지 않다", "매우 그렇다"],
  },
  {
    clientId: cid(),
    type: "likert_multi",
    prompt:
      "담당공직자에 대해 답변해 주세요.\n(① 매우 그렇다 ~ ⑦ 전혀 그렇지 않다)",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: [
      "문2. 담당공직자들이 기준이나 절차를 위반하여 업무를 처리하는 경우가 있다고 생각하십니까?",
      "문3. 담당공직자들이 적극적으로 업무를 완수하지 않고 직무태만, 불합리한 관행 반복과 같이 소극적으로 업무를 처리하는 경우가 있다고 생각하십니까?",
      "문4. 담당공직자들이 업무를 처리하면서 연고나 사적 이해관계에 따라 일부 사람에게만 부당하게 특혜를 주는 경우가 있다고 생각하십니까?",
      "문5. 담당공직자들이 권한을 남용하여 부당한 요구나 처분을 하거나, 처리 지연이나 거부 등을 하는 경우가 있다고 생각하십니까?",
      "문6. 담당공직자들이 직무와 관련하여 알게 된 비밀, 미공개정보 등을 이용하거나 그 밖의 위법·부당한 방법으로 사적인 이익을 취하는 경우가 있다고 생각하십니까?",
    ],
  },
  {
    clientId: cid(),
    type: "mc_single",
    prompt:
      "Section B. 부패 경험\n\n문7. 선생님 본인 또는 동료가 충청남도 직원에게 다음의 5가지 보기를 제공했거나, 제공하기로 약속했거나, 요구받은 적이 있는지 응답해 주세요.",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: [
      "규정에 위반된 돈, 선물, 강연료, 기부금 등 제공",
      "규정에 위반된 식사, 접대, 골프, 여행 등 제공",
      "규정이나 계약 이상의 숙박·교통 편의, 행사협찬, 부당한 업무지원 등 제공",
      "채용청탁, 채무면제 등 사적 이익 제공",
      "부동산 거래 등 특혜나 투자 관련 미공개 정보 제공",
      "경험 적 없음 ☞ 문10으로",
    ],
  },
  {
    clientId: cid(),
    type: "mc_single",
    prompt:
      "문8. (경험이 있는 경우만) 금품이나 향응 또는 각종 편의 등을 어떤 이유로 제공하셨습니까?",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [
      { sourceOrderIndex: 6, optionIndex: 0 },
      { sourceOrderIndex: 6, optionIndex: 1 },
      { sourceOrderIndex: 6, optionIndex: 2 },
      { sourceOrderIndex: 6, optionIndex: 3 },
      { sourceOrderIndex: 6, optionIndex: 4 },
    ],
    options: [
      "담당 공무원이 먼저 요구",
      "신속한 업무처리를 위해",
      "관련정보 수집 등 업무편의를 위해",
      "법령 위반 사항에 대한 처벌무마/완화 등을 위해",
      "일처리에 대한 감사의 뜻으로",
    ],
  },
  {
    clientId: cid(),
    type: "likert_7",
    prompt:
      "Section C. 업무처리 만족도\n\n문9. 공무원의 업무처리 결과에 만족하십니까?",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: ["매우 불만족", "매우 만족"],
  },
  {
    clientId: cid(),
    type: "mc_single",
    prompt:
      "Section D. 신뢰도저해요인 / 건의사항 및 의견수렴\n\n문10. (신뢰도 저해요인) 공무원으로부터 청렴만족도 설문에 참여하게 되면 점수를 잘 주라는 취지의 부탁을 받으신 적이 있습니까?",
    allowSkip: false,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: ["있다", "없다"],
  },
  {
    clientId: cid(),
    type: "text_single",
    prompt:
      "문11. 끝으로 충청남도에 건의사항이나 기타 하시고 싶은 말씀이 있으시면 이야기해 주세요.",
    allowSkip: true,
    staffOnly: false,
    visibilityRules: [{ sourceOrderIndex: 1, optionIndex: 0 }],
    options: [],
  },
];

const admin = createSupabaseAdminFromEnv();
if (!admin) {
  console.error("SUPABASE env 필요");
  process.exit(1);
}

const title = "2026년 충남도청 외부 청렴도";
const slug = `2026년-충남도청-외부-청렴도-${randomUUID().slice(0, 8)}`;

const { data: survey, error: surveyError } = await admin
  .from("surveys")
  .insert({
    slug,
    title,
    summary:
      "충청남도 외부 청렴도(부패인식·부패경험·업무처리 만족도·신뢰도 저해요인) 조사입니다.",
    period_start: periodStart,
    period_end: periodEnd,
    period_label: periodLabel,
    target_count: 300,
    status: "진행중",
    listed_public: true,
    response_script: "",
    response_count: 0,
  })
  .select("id, slug")
  .single();

if (surveyError || !survey) {
  console.error(surveyError?.message ?? "설문 생성 실패");
  process.exit(1);
}

const OPTION_TYPES = new Set(["mc_single", "mc_multi", "dropdown", "rank", "likert_multi", "contact_fields"]);

for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  const row = {
    survey_id: survey.id,
    order_index: i,
    prompt: q.prompt,
    question_type: q.type,
    allow_skip: q.allowSkip,
    staff_only: q.staffOnly,
    visibility_rules:
      q.visibilityRules.length > 0 ? q.visibilityRules : null,
    max_selections: null,
    text_line_count: null,
  };

  const { data: qRow, error: qErr } = await admin
    .from("survey_questions")
    .insert(row)
    .select("id")
    .single();

  if (qErr || !qRow) {
    console.error(`문항 ${i + 1}:`, qErr?.message);
    process.exit(1);
  }

  if (OPTION_TYPES.has(q.type)) {
    const opts = q.options.map((label, order_index) => ({
      question_id: qRow.id,
      order_index,
      label,
      is_other: false,
    }));
    const { error: oErr } = await admin.from("survey_question_options").insert(opts);
    if (oErr) {
      console.error(`문항 ${i + 1} 보기:`, oErr.message);
      process.exit(1);
    }
  }

  if (q.type === "likert_7") {
    const opts = [];
    if (q.options[0]) {
      opts.push({ question_id: qRow.id, order_index: 0, label: q.options[0] });
    }
    if (q.options[1]) {
      opts.push({ question_id: qRow.id, order_index: 1, label: q.options[1] });
    }
    if (opts.length) {
      const { error: oErr } = await admin.from("survey_question_options").insert(opts);
      if (oErr) {
        console.error(`문항 ${i + 1} 척도:`, oErr.message);
        process.exit(1);
      }
    }
  }
}

console.log("생성 완료");
console.log("  title:", title);
console.log("  slug:", survey.slug);
console.log("  문항:", questions.length, "개");
console.log("  편집: /admin/surveys/edit?slug=" + encodeURIComponent(survey.slug));
console.log("  참여: /survey/" + survey.slug);
