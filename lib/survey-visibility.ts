import type { DraftQuestion, QuestionType } from "@/lib/survey-types";
import type { PublicSurveyQuestion } from "@/lib/survey-public";

/** DB·편집기에 저장되는 조건 (기준 문항 순서·보기 인덱스) */
export type QuestionVisibilityCondition = {
  sourceOrderIndex: number;
  optionIndex: number;
};

/** 참여 화면·제출 검증용 (기준 문항 id·보기 인덱스) */
export type ResolvedVisibilityRule = {
  sourceQuestionId: string;
  optionIndex: number;
};

/** 분기점(표시 조건 기준 문항)으로 허용되는 유형 — 보기 하나만 고르는 객관식·드롭다운만 */
export const BRANCHING_SOURCE_TYPES: QuestionType[] = ["mc_single", "dropdown"];

/** 설문·AI·관리자 UI에 공통으로 쓰는 분기 규칙 문구 */
export const SURVEY_BRANCHING_SOURCE_RULE =
  "분기점을 만드는 문항(표시 조건의 기준 문항)은 반드시 객관식(단일 선택) 또는 드롭다운 유형이어야 합니다.";

export const SURVEY_BRANCHING_SOURCE_RULE_DETAIL =
  "객관식(다중 선택)·척도·주관식·순위·별점 등은 분기 기준으로 사용할 수 없습니다.";

export function isBranchingSourceType(type: QuestionType): boolean {
  return (BRANCHING_SOURCE_TYPES as readonly string[]).includes(type);
}

export function parseStoredVisibilityRules(raw: unknown): QuestionVisibilityCondition[] {
  if (!Array.isArray(raw)) return [];
  const out: QuestionVisibilityCondition[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const sourceOrderIndex = Number(
      (item as { sourceOrderIndex?: unknown }).sourceOrderIndex,
    );
    const optionIndex = Number((item as { optionIndex?: unknown }).optionIndex);
    if (
      !Number.isInteger(sourceOrderIndex) ||
      sourceOrderIndex < 0 ||
      !Number.isInteger(optionIndex) ||
      optionIndex < 0
    ) {
      continue;
    }
    out.push({ sourceOrderIndex, optionIndex });
  }
  return out;
}

export function resolveVisibilityRulesForPublic(
  questionOrderIndex: number,
  stored: QuestionVisibilityCondition[],
  questionsByOrder: Map<number, { id: string }>,
): ResolvedVisibilityRule[] {
  return stored
    .filter((r) => r.sourceOrderIndex < questionOrderIndex)
    .map((r) => {
      const source = questionsByOrder.get(r.sourceOrderIndex);
      if (!source) return null;
      return { sourceQuestionId: source.id, optionIndex: r.optionIndex };
    })
    .filter((r): r is ResolvedVisibilityRule => r != null);
}

export type BranchingAnswerSnapshot = {
  mcSingle: Record<string, string>;
  dropdown: Record<string, string>;
};

export function branchingSnapshotFromAnswers(
  answers: {
    questionId: string;
    type: string;
    optionId?: string;
  }[],
): BranchingAnswerSnapshot {
  const mcSingle: Record<string, string> = {};
  const dropdown: Record<string, string> = {};
  for (const a of answers) {
    if (a.type === "mc_single" && a.optionId) {
      mcSingle[a.questionId] = a.optionId;
    }
    if (a.type === "dropdown" && a.optionId) {
      dropdown[a.questionId] = a.optionId;
    }
  }
  return { mcSingle, dropdown };
}

export function branchingSnapshotFromFormState(
  mcSingle: Record<string, string>,
  dropdown: Record<string, string>,
): BranchingAnswerSnapshot {
  return { mcSingle, dropdown };
}

function selectedOptionIdForBranching(
  question: Pick<PublicSurveyQuestion, "id" | "type" | "options">,
  snapshot: BranchingAnswerSnapshot,
): string | null {
  if (question.type === "mc_single") {
    const id = snapshot.mcSingle[question.id];
    return id?.trim() ? id : null;
  }
  if (question.type === "dropdown") {
    const id = snapshot.dropdown[question.id];
    return id?.trim() ? id : null;
  }
  return null;
}

function rulesMatch(
  rules: ResolvedVisibilityRule[],
  questionsById: Map<string, PublicSurveyQuestion>,
  snapshot: BranchingAnswerSnapshot,
): boolean {
  if (rules.length === 0) return true;
  // 조건이 여러 개이면 하나라도 만족하면 표시 (OR)
  return rules.some((rule) => {
    const source = questionsById.get(rule.sourceQuestionId);
    if (!source) return false;
    const selectedId = selectedOptionIdForBranching(source, snapshot);
    if (!selectedId) return false;
    const target = source.options[rule.optionIndex];
    return !!target && target.id === selectedId;
  });
}

export function isPublicQuestionVisible(
  question: PublicSurveyQuestion,
  allQuestions: PublicSurveyQuestion[],
  snapshot: BranchingAnswerSnapshot,
  isStaff: boolean,
): boolean {
  if (question.staffOnly && !isStaff) return false;
  if (!question.visibilityRules?.length) return true;
  const questionsById = new Map(allQuestions.map((q) => [q.id, q]));
  return rulesMatch(question.visibilityRules, questionsById, snapshot);
}

/** 해당 문항에서 「조사 종료」 보기를 선택했는지 */
export function isEndsSurveyOptionSelected(
  question: Pick<PublicSurveyQuestion, "id" | "type" | "options">,
  snapshot: BranchingAnswerSnapshot,
): boolean {
  const selectedId = selectedOptionIdForBranching(question, snapshot);
  if (!selectedId) return false;
  const opt = question.options.find((o) => o.id === selectedId);
  return Boolean(opt?.endsSurvey);
}

/**
 * 앞선(보이는) 문항에서 조사 종료 보기를 고르면, 그보다 뒤 문항은 숨김.
 * staffOnly·visibilityRules 통과 여부와 별도로 적용.
 */
export function isBlockedBySurveyEnd(
  question: PublicSurveyQuestion,
  allQuestions: PublicSurveyQuestion[],
  snapshot: BranchingAnswerSnapshot,
  isStaff: boolean,
): boolean {
  for (const prior of allQuestions) {
    if (prior.orderIndex >= question.orderIndex) break;
    if (!isPublicQuestionVisible(prior, allQuestions, snapshot, isStaff)) continue;
    if (isEndsSurveyOptionSelected(prior, snapshot)) return true;
  }
  return false;
}

/** 참여·제출에 실제로 노출되는 문항인지 (표시 조건 + 조사 종료) */
export function isQuestionShownInSurvey(
  question: PublicSurveyQuestion,
  allQuestions: PublicSurveyQuestion[],
  snapshot: BranchingAnswerSnapshot,
  isStaff: boolean,
): boolean {
  if (!isPublicQuestionVisible(question, allQuestions, snapshot, isStaff)) {
    return false;
  }
  return !isBlockedBySurveyEnd(question, allQuestions, snapshot, isStaff);
}

/** 참여 화면·제출 검증 메시지용 — 현재 보이는 문항만 1부터 연속 번호 */
export function buildParticipantDisplayNumbers(
  questions: PublicSurveyQuestion[],
  snapshot: BranchingAnswerSnapshot,
  isStaff: boolean,
): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  for (const q of questions) {
    if (!isQuestionShownInSurvey(q, questions, snapshot, isStaff)) continue;
    // 글/그림/영상(안내) 문항은 번호 없이 표기만 함
    if (q.type === "info_media") continue;
    n += 1;
    map.set(q.id, n);
  }
  return map;
}

export function remapRulesAfterSwap(
  questions: DraftQuestion[],
  indexA: number,
  indexB: number,
): DraftQuestion[] {
  const copy = [...questions];
  [copy[indexA], copy[indexB]] = [copy[indexB], copy[indexA]];

  const remapIndex = (oldIndex: number): number => {
    if (oldIndex === indexA) return indexB;
    if (oldIndex === indexB) return indexA;
    return oldIndex;
  };

  return copy.map((q) => ({
    ...q,
    visibilityRules: q.visibilityRules.map((r) => ({
      ...r,
      sourceOrderIndex: remapIndex(r.sourceOrderIndex),
    })),
  }));
}

export function remapRulesAfterRemove(
  questions: DraftQuestion[],
  removedIndex: number,
): DraftQuestion[] {
  return questions
    .filter((_, i) => i !== removedIndex)
    .map((q) => ({
      ...q,
      visibilityRules: q.visibilityRules
        .filter((r) => r.sourceOrderIndex !== removedIndex)
        .map((r) => ({
          ...r,
          sourceOrderIndex:
            r.sourceOrderIndex > removedIndex
              ? r.sourceOrderIndex - 1
              : r.sourceOrderIndex,
        })),
    }));
}

export function validateVisibilityRules(
  q: DraftQuestion,
  questionIndex: number,
  allQuestions: DraftQuestion[],
): string | null {
  for (const rule of q.visibilityRules) {
    if (!isVisibilityRuleValid(rule, questionIndex, allQuestions)) {
      if (rule.sourceOrderIndex >= questionIndex) {
        return `문항 ${questionIndex + 1}: 표시 조건의 기준 문항은 이 문항보다 앞에 있어야 합니다.`;
      }
      const source = allQuestions[rule.sourceOrderIndex];
      if (!source) {
        return `문항 ${questionIndex + 1}: 표시 조건의 기준 문항을 찾을 수 없습니다.`;
      }
      if (!isBranchingSourceType(source.type)) {
        return `문항 ${questionIndex + 1}: ${SURVEY_BRANCHING_SOURCE_RULE}`;
      }
      return `문항 ${questionIndex + 1}: 표시 조건의 보기 번호가 올바르지 않습니다.`;
    }
  }
  return null;
}

function isVisibilityRuleValid(
  rule: QuestionVisibilityCondition,
  questionIndex: number,
  allQuestions: DraftQuestion[],
): boolean {
  if (rule.sourceOrderIndex >= questionIndex) return false;
  const source = allQuestions[rule.sourceOrderIndex];
  if (!source || !isBranchingSourceType(source.type)) return false;
  const optCount = source.options.map((o) => o.trim()).filter(Boolean).length;
  return rule.optionIndex >= 0 && rule.optionIndex < optCount;
}

/** AI 생성 등에서 잘못된 분기 조건을 제거할 때 사용 */
export function sanitizeVisibilityRules(
  q: DraftQuestion,
  questionIndex: number,
  allQuestions: DraftQuestion[],
): DraftQuestion {
  if (q.visibilityRules.length === 0) return q;
  return {
    ...q,
    visibilityRules: q.visibilityRules.filter((rule) =>
      isVisibilityRuleValid(rule, questionIndex, allQuestions),
    ),
  };
}
