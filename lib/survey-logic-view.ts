import type { DraftQuestion, QuestionType } from "@/lib/survey-types";
import { QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import { isBranchingSourceType } from "@/lib/survey-visibility";

export type ResolvedVisibilityCondition = {
  sourceNumber: number;
  sourcePrompt: string;
  optionLabel: string;
};

export type LogicQuestionRow = {
  number: number;
  type: QuestionType;
  typeLabel: string;
  prompt: string;
  staffOnly: boolean;
  allowSkip: boolean;
  options: string[];
  isBranchingSource: boolean;
  /** 이 문항 보기 중 조건부 문항과 연결된 분기만 */
  linkedBranches: BranchFromOption[];
  /** 분기 포크 아래에만 표시 (메인 흐름 줄에서는 숨김) */
  showOnSpine: boolean;
  visibilityMode: "always" | "conditional";
  visibilityConditions: ResolvedVisibilityCondition[];
};

export type BranchFromOption = {
  sourceNumber: number;
  sourcePrompt: string;
  optionIndex: number;
  optionLabel: string;
  targetNumbers: number[];
};

export type SurveyLogicModel = {
  questions: LogicQuestionRow[];
  branches: BranchFromOption[];
  hasStaffOnly: boolean;
  hasBranching: boolean;
  hasAnyLogic: boolean;
};

function optionLabel(options: string[], optionIndex: number): string {
  const label = options[optionIndex]?.trim();
  return label || `보기 ${optionIndex + 1}`;
}

/** 조건부 규칙에 실제로 쓰인 보기 인덱스만 (연결 대상 있는 것만) */
function referencedBranchOptionIndices(
  sourceIndex: number,
  questions: DraftQuestion[],
): number[] {
  const referenced = new Set<number>();
  for (const q of questions) {
    for (const r of q.visibilityRules) {
      if (r.sourceOrderIndex === sourceIndex) {
        referenced.add(r.optionIndex);
      }
    }
  }
  return [...referenced].sort((a, b) => a - b);
}

export function buildSurveyLogicModel(questions: DraftQuestion[]): SurveyLogicModel {
  const rows: LogicQuestionRow[] = questions.map((q, i) => {
    const visibilityConditions = q.visibilityRules.map((r) => {
      const source = questions[r.sourceOrderIndex];
      return {
        sourceNumber: r.sourceOrderIndex + 1,
        sourcePrompt: source?.prompt.trim() || `문항 ${r.sourceOrderIndex + 1}`,
        optionLabel: source
          ? optionLabel(source.options, r.optionIndex)
          : `보기 ${r.optionIndex + 1}`,
      };
    });

    return {
      number: i + 1,
      type: q.type,
      typeLabel: QUESTION_TYPE_LABELS[q.type],
      prompt: q.prompt.trim() || "(질문 없음)",
      staffOnly: q.staffOnly,
      allowSkip: q.allowSkip,
      options: q.options.map((o) => o.trim()).filter(Boolean),
      isBranchingSource: isBranchingSourceType(q.type),
      linkedBranches: [],
      showOnSpine: true,
      visibilityMode: q.visibilityRules.length > 0 ? "conditional" : "always",
      visibilityConditions,
    };
  });

  const branches: BranchFromOption[] = [];
  for (let si = 0; si < questions.length; si++) {
    const source = questions[si];
    if (!isBranchingSourceType(source.type)) continue;

    const optionIndices = referencedBranchOptionIndices(si, questions);
    if (optionIndices.length === 0) continue;

    for (const optionIndex of optionIndices) {
      const targetIndices: number[] = [];
      for (let ti = 0; ti < questions.length; ti++) {
        const rules = questions[ti].visibilityRules;
        if (rules.some((r) => r.sourceOrderIndex === si && r.optionIndex === optionIndex)) {
          targetIndices.push(ti);
        }
      }

      if (targetIndices.length === 0) continue;

      branches.push({
        sourceNumber: si + 1,
        sourcePrompt: source.prompt.trim() || `문항 ${si + 1}`,
        optionIndex,
        optionLabel: optionLabel(source.options, optionIndex),
        targetNumbers: targetIndices.map((i) => i + 1),
      });
    }
  }

  const branchTargetNumbers = new Set<number>();
  for (const b of branches) {
    for (const n of b.targetNumbers) {
      branchTargetNumbers.add(n);
    }
  }

  for (const row of rows) {
    row.linkedBranches = branches.filter((b) => b.sourceNumber === row.number);
    row.showOnSpine = !branchTargetNumbers.has(row.number);
  }

  const hasStaffOnly = rows.some((r) => r.staffOnly);
  const hasBranching =
    rows.some((r) => r.visibilityMode === "conditional") || branches.length > 0;
  const hasAnyLogic = hasStaffOnly || hasBranching;

  return { questions: rows, branches, hasStaffOnly, hasBranching, hasAnyLogic };
}
