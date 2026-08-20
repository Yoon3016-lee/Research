import { clampLikertScaleSize } from "@/lib/likert-scale";

/** ①(긍정) ~ N점(부정) 양끝 표현 */
export type LikertLabelTemplate = {
  id: string;
  /** 선택 목록 표시 */
  label: string;
  /** 1점 — 긍정·동의 쪽 */
  positive: string;
  /** N점 — 부정·비동의 쪽 */
  negative: string;
};

export const LIKERT_LABEL_TEMPLATES: LikertLabelTemplate[] = [
  {
    id: "agree-disagree",
    label: "그렇다 / 그렇지 않다",
    positive: "그렇다",
    negative: "그렇지 않다",
  },
  {
    id: "consent",
    label: "동의함 / 동의하지 않음",
    positive: "동의함",
    negative: "동의하지 않음",
  },
  {
    id: "appropriate",
    label: "적절함 / 적절하지 않음",
    positive: "적절함",
    negative: "적절하지 않음",
  },
  {
    id: "clear",
    label: "명확함 / 명확하지 않음",
    positive: "명확함",
    negative: "명확하지 않음",
  },
  {
    id: "rational",
    label: "합리적임 / 합리적이지 않음",
    positive: "합리적임",
    negative: "합리적이지 않음",
  },
  {
    id: "professional",
    label: "전문적임 / 전문적이지 않음",
    positive: "전문적임",
    negative: "전문적이지 않음",
  },
];

function buildSemanticLevels(positive: string, negative: string): string[] {
  return [
    `매우 ${positive}`,
    positive,
    `약간 ${positive}`,
    "보통",
    `약간 ${negative}`,
    negative,
    `전혀 ${negative}`,
  ];
}

/** 7단계 의미 축에서 척도 크기에 맞게 인덱스 선택 */
function pickSemanticIndices(scaleSize: number): number[] {
  const maxIdx = 6;
  if (scaleSize <= 1) return [3];

  const indices: number[] = [];
  for (let i = 0; i < scaleSize; i++) {
    indices.push(Math.round((i / (scaleSize - 1)) * maxIdx));
  }

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] < indices[i - 1]) indices[i] = indices[i - 1];
  }
  for (let i = indices.length - 2; i >= 0; i--) {
    if (indices[i] > indices[i + 1]) indices[i] = indices[i + 1];
  }

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === indices[i - 1] && indices[i] < maxIdx) {
      indices[i] = indices[i - 1] + 1;
    }
  }
  for (let i = indices.length - 2; i >= 0; i--) {
    if (indices[i] === indices[i + 1] && indices[i] > 0) {
      indices[i] = indices[i + 1] - 1;
    }
  }

  return indices;
}

/** 템플릿 + 척도 크기 → ①~N점 라벨 배열 (매우~전혀 포함) */
export function expandLikertLabelTemplate(
  template: Pick<LikertLabelTemplate, "positive" | "negative">,
  scaleSize: number,
): string[] {
  const size = clampLikertScaleSize(scaleSize);
  const { positive, negative } = template;

  if (size === 2) return [positive, negative];
  if (size === 3) return [positive, "보통", negative];

  const levels = buildSemanticLevels(positive, negative);
  return pickSemanticIndices(size).map((idx) => levels[idx]);
}

export function findLikertLabelTemplate(id: string): LikertLabelTemplate | undefined {
  return LIKERT_LABEL_TEMPLATES.find((t) => t.id === id);
}
