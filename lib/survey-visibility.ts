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

export const BRANCHING_SOURCE_TYPES: QuestionType[] = ["mc_single", "dropdown"];

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
  return rules.every((rule) => {
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

/** 참여 화면·제출 검증 메시지용 — 현재 보이는 문항만 1부터 연속 번호 */
export function buildParticipantDisplayNumbers(
  questions: PublicSurveyQuestion[],
  snapshot: BranchingAnswerSnapshot,
  isStaff: boolean,
): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  for (const q of questions) {
    if (!isPublicQuestionVisible(q, questions, snapshot, isStaff)) continue;
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
    if (rule.sourceOrderIndex >= questionIndex) {
      return `문항 ${questionIndex + 1}: 표시 조건의 기준 문항은 이 문항보다 앞에 있어야 합니다.`;
    }
    const source = allQuestions[rule.sourceOrderIndex];
    if (!source) {
      return `문항 ${questionIndex + 1}: 표시 조건의 기준 문항을 찾을 수 없습니다.`;
    }
    if (!isBranchingSourceType(source.type)) {
      return `문항 ${questionIndex + 1}: 분기 기준은 객관식(단일)·드롭다운만 사용할 수 있습니다.`;
    }
    const optCount = source.options.map((o) => o.trim()).filter(Boolean).length;
    if (rule.optionIndex < 0 || rule.optionIndex >= optCount) {
      return `문항 ${questionIndex + 1}: 표시 조건의 보기 번호가 올바르지 않습니다.`;
    }
  }
  return null;
}
