import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicSurveyQuestion } from "@/lib/survey-public";
import type { QuestionType } from "@/lib/survey-types";
import {
  isQuestionShownInSurvey,
  parseStoredVisibilityRules,
  resolveVisibilityRulesForPublic,
  type BranchingAnswerSnapshot,
} from "@/lib/survey-visibility";

/** CLI·스크립트용 상한 */
export const SEED_MAX_COUNT = 5000;

/** 관리자 UI용 상한 (타임아웃 방지) */
export const SEED_ADMIN_MAX_COUNT = 100;

type ProfileValue = number | number[];

function pick<T>(arr: T[], index: number): T {
  return arr[Math.min(index, arr.length - 1)];
}

function profileIndex(raw: ProfileValue | undefined, fallback = 0): number {
  if (Array.isArray(raw)) return typeof raw[0] === "number" ? raw[0] : fallback;
  if (typeof raw === "number") return raw;
  return fallback;
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function toAnswerJson(
  q: PublicSurveyQuestion,
  profile: ProfileValue[],
  qIndex: number,
): Record<string, unknown> | null {
  const type = q.type;
  const options = q.options;
  const scaleSize = clampInt(q.maxSelections ?? 5, 2, 10);

  if (type === "info_media") {
    return null;
  }
  if (type === "mc_single" || type === "dropdown") {
    const opt = pick(options, profileIndex(profile[qIndex], qIndex));
    return opt ? { optionId: opt.id } : null;
  }
  if (type === "mc_multi") {
    const max = q.maxSelections ?? 4;
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
    const idx = profileIndex(profile[qIndex], 0);
    return { text: pick(samples, idx) };
  }
  if (type === "text_multi") {
    if (options.length > 0) {
      const values: Record<string, string> = {};
      for (let i = 0; i < options.length; i++) {
        values[options[i].id] = `항목 ${i + 1} 응답 예시`;
      }
      return { values };
    }
    return { lines: ["첫 번째 의견", "두 번째 의견"] };
  }
  if (type === "rank") {
    const ids = options.map((o) => o.id).filter(Boolean);
    const rankCount = clampInt(q.maxSelections ?? Math.min(3, ids.length), 1, ids.length || 1);
    const shift = typeof profile[qIndex] === "number" ? profile[qIndex] : 0;
    const rotated = [...ids.slice(shift % ids.length), ...ids.slice(0, shift % ids.length)];
    const ranked = rotated.slice(0, rankCount);
    return ranked.length ? { rankedOptionIds: ranked } : null;
  }
  if (type === "likert_multi") {
    const values: Record<string, number> = {};
    const base =
      typeof profile[qIndex] === "number" ? profile[qIndex] : qIndex % scaleSize;
    for (let i = 0; i < options.length; i++) {
      values[options[i].id] = clampInt(((base + i) % scaleSize) + 1, 1, scaleSize);
    }
    return Object.keys(values).length ? { values } : null;
  }
  if (type === "star_rating") {
    const stars = [2, 2.5, 3, 3.5, 4, 4.5, 5];
    const idx = profileIndex(profile[qIndex], 0);
    return { value: pick(stars, idx) };
  }
  if (type === "contact_fields") {
    const samples = [
      { name: "김민수", phone: "010-1234-5678", dept: "본점" },
      { name: "이서연", phone: "010-2345-6789", dept: "운영팀" },
      { name: "박준호", phone: "010-3456-7890", dept: "매장관리" },
      { name: "최유진", phone: "010-4567-8901", dept: "카페" },
      { name: "정하늘", phone: "010-5678-9012", dept: "영업" },
    ];
    const idx = profileIndex(profile[qIndex], 0);
    const s = pick(samples, idx);
    const values: Record<string, string> = {};
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

function applyAnswerToSnapshot(
  snapshot: BranchingAnswerSnapshot,
  q: PublicSurveyQuestion,
  json: Record<string, unknown>,
): void {
  if (q.type !== "mc_single" && q.type !== "dropdown") return;
  const optionId = typeof json.optionId === "string" ? json.optionId : null;
  if (!optionId) return;
  if (q.type === "mc_single") snapshot.mcSingle[q.id] = optionId;
  else snapshot.dropdown[q.id] = optionId;
}

const PROFILES: ProfileValue[][] = [
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

type QuestionRow = {
  id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  allow_skip: boolean;
  staff_only: boolean | null;
  visibility_rules: unknown;
  max_selections: number | null;
  text_line_count: number | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  order_index: number;
  label: string | null;
  ends_survey?: boolean | null;
};

function mapToPublicQuestions(
  qRows: QuestionRow[],
  optionRows: OptionRow[],
): PublicSurveyQuestion[] {
  const optionsByQuestion = new Map<
    string,
    PublicSurveyQuestion["options"]
  >();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push({
      id: o.id,
      label: o.label ?? "",
      isOther: false,
      endsSurvey: Boolean(o.ends_survey),
    });
    optionsByQuestion.set(o.question_id, list);
  }

  const questionsByOrder = new Map(qRows.map((q) => [q.order_index, { id: q.id }]));

  return qRows.map((q) => {
    const type = q.question_type as QuestionType;
    const rowOptions = optionsByQuestion.get(q.id) ?? [];
    return {
      id: q.id,
      orderIndex: q.order_index,
      type,
      prompt: q.prompt ?? "",
      allowSkip: Boolean(q.allow_skip),
      staffOnly: Boolean(q.staff_only),
      visibilityRules: resolveVisibilityRulesForPublic(
        q.order_index,
        parseStoredVisibilityRules(q.visibility_rules),
        questionsByOrder,
      ),
      maxSelections: q.max_selections,
      textLineCount: q.text_line_count,
      likertScaleLabels: [],
      options: type === "likert_7" ? [] : rowOptions,
      infoBody: null,
      mediaUrl: null,
      mediaType: null,
    };
  });
}

async function loadQuestions(
  admin: SupabaseClient,
  surveyId: string,
): Promise<{ questions: PublicSurveyQuestion[]; error?: string }> {
  const { data: questionRows, error: qErr } = await admin
    .from("survey_questions")
    .select(
      "id, order_index, prompt, question_type, max_selections, allow_skip, staff_only, visibility_rules, text_line_count",
    )
    .eq("survey_id", surveyId)
    .order("order_index");

  if (qErr) return { questions: [], error: qErr.message };

  const qRows = (questionRows ?? []) as QuestionRow[];
  const qids = qRows.map((q) => q.id);
  if (qids.length === 0) {
    return { questions: [] };
  }

  let optionRows: OptionRow[] = [];
  const withEnds = await admin
    .from("survey_question_options")
    .select("id, question_id, order_index, label, ends_survey")
    .in("question_id", qids)
    .order("order_index");

  if (withEnds.error?.message.includes("ends_survey")) {
    const fallback = await admin
      .from("survey_question_options")
      .select("id, question_id, order_index, label")
      .in("question_id", qids)
      .order("order_index");
    if (fallback.error) return { questions: [], error: fallback.error.message };
    optionRows = (fallback.data ?? []) as OptionRow[];
  } else if (withEnds.error) {
    return { questions: [], error: withEnds.error.message };
  } else {
    optionRows = (withEnds.data ?? []) as OptionRow[];
  }

  return { questions: mapToPublicQuestions(qRows, optionRows) };
}

function buildAnswersForProfile(
  questions: PublicSurveyQuestion[],
  profile: ProfileValue[],
  responseId: string,
): { response_id: string; question_id: string; answer: Record<string, unknown> }[] {
  const snapshot: BranchingAnswerSnapshot = { mcSingle: {}, dropdown: {} };
  const answerRows: {
    response_id: string;
    question_id: string;
    answer: Record<string, unknown>;
  }[] = [];

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    // 게스트 더미 응답 — staff_only·표시 조건·조사 종료와 동일 규칙
    if (!isQuestionShownInSurvey(q, questions, snapshot, false)) {
      continue;
    }

    const json = toAnswerJson(q, profile, qi);
    if (!json) continue;

    answerRows.push({
      response_id: responseId,
      question_id: q.id,
      answer: json,
    });
    applyAnswerToSnapshot(snapshot, q, json);
  }

  return answerRows;
}

export type SeedSurveyResponsesResult =
  | { ok: true; inserted: number; totalCount: number; title: string; slug: string }
  | { ok: false; error: string };

export async function seedSurveyResponses(
  admin: SupabaseClient,
  slug: string,
  count: number,
  maxCount = SEED_MAX_COUNT,
): Promise<SeedSurveyResponsesResult> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return { ok: false, error: "설문 ID가 없습니다." };
  }

  const safeCount = Math.max(1, Math.min(maxCount, Math.floor(count) || 1));

  const { data: survey, error: sErr } = await admin
    .from("surveys")
    .select("id, slug, title, response_count")
    .eq("slug", trimmed)
    .maybeSingle();

  if (sErr) return { ok: false, error: sErr.message };
  if (!survey) return { ok: false, error: "설문을 찾을 수 없습니다." };

  const loaded = await loadQuestions(admin, survey.id as string);
  if (loaded.error) return { ok: false, error: loaded.error };
  const questions = loaded.questions;

  let inserted = 0;
  let responseCount = (survey.response_count as number) ?? 0;

  for (let i = 0; i < safeCount; i++) {
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
      return {
        ok: false,
        error: resErr?.message ?? `응답 ${i + 1}건째 insert에 실패했습니다.`,
      };
    }

    const answerRows = buildAnswersForProfile(
      questions,
      profile,
      response.id as string,
    );

    if (answerRows.length > 0) {
      const { error: ansErr } = await admin.from("survey_response_answers").insert(answerRows);
      if (ansErr) {
        return { ok: false, error: ansErr.message };
      }
    }

    responseCount += 1;
    inserted += 1;
  }

  const { error: updateErr } = await admin
    .from("surveys")
    .update({ response_count: responseCount })
    .eq("id", survey.id);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  return {
    ok: true,
    inserted,
    totalCount: responseCount,
    title: survey.title as string,
    slug: survey.slug as string,
  };
}
