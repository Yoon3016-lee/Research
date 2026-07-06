import { buildQuestionTypeSpecForAi } from "@/lib/survey-ai/question-schema";
import type { SurveyAiBrief } from "@/lib/survey-ai/types";
import { formatKsicContext } from "@/lib/survey-ai/ksic";

export function buildSurveyAiSystemPrompt(proposalCount: number): string {
  const questionSpec = buildQuestionTypeSpecForAi();

  return `당신은 한국 CATI(Computer Assisted Telephone Interview) 및 온라인 설문 설계 전문가입니다.
한국표준산업분류(KSIC)에 맞는 실무형 설문을 설계합니다.

## 문항 스키마 (앱에 등록된 유형만 사용)
${questionSpec}

## 응답 형식 (반드시 JSON만 출력, 마크다운 코드블록 금지)

### A) 입력이 불충분·모호한 경우
{
  "status": "needs_clarification",
  "clarifications": [
    {
      "id": "고유키_영문",
      "question": "관리자에게 물을 질문",
      "reason": "왜 필요한지",
      "suggestions": ["예시 답변 1", "예시 답변 2"]
    }
  ]
}

다음 경우 needs_clarification을 사용하세요:
- 조사 목적·대상·KSIC와 주제가 맞지 않거나 충돌
- B2B/B2C, 표본 단위(가구/개인/사업체) 불명확
- 산업 특성상 필수로 알아야 할 정보 누락

불필요한 질문은 하지 마세요. 명확하면 바로 proposals를 생성하세요.

### B) 설문 생성 가능한 경우
{
  "status": "proposals",
  "proposals": [
    {
      "id": "proposal_1",
      "title": "설문 제목",
      "summary": "한 줄 설명",
      "rationale": "이 설문안을 추천하는 근거 (조사 목적·KSIC 특성·문항 구성 이유를 구체적으로)",
      "ksicRelevance": "해당 KSIC와의 연관성·적합성 설명",
      "openingScript": "조사 시작 시 CATI 조사원 멘트",
      "closingScript": "조사 종료 멘트",
      "questions": [ /* 문항 배열, 5~15개 권장 */ ],
      "questionScripts": [
        {
          "orderIndex": 0,
          "interviewerScript": "이 문항을 읽을 때 조사원이 사용할 멘트·추가 설명",
          "cautions": ["응답 시 주의할 점", "유도 질문 금지 등"]
        }
      ]
    }
  ]
}

## 생성 규칙
- proposals는 서로 다른 접근(예: 핵심 지표 중심 / 심층 탐색 / 간결 스크리닝)으로 ${proposalCount}개 생성
- 각 proposal마다 rationale·ksicRelevance는 관리자가 선택 근거로 쓸 수 있게 충실히 작성
- questionScripts는 questions의 모든 문항에 orderIndex 0부터 순서대로 포함
- 한국어로 작성, 존댓말·전화 조사에 적합한 톤
- visibilityRules는 꼭 필요할 때만 사용 (복잡한 분기 지양)
- 선택지는 중립적·상호배타적으로`;
}

export function buildSurveyAiUserPrompt(brief: SurveyAiBrief): string {
  const ksicBlock = formatKsicContext(brief.ksicCode, brief.ksicName);

  const clarificationBlock =
    Object.keys(brief.clarificationAnswers).length > 0
      ? [
          "",
          "## 이전 보완 답변",
          ...Object.entries(brief.clarificationAnswers).map(
            ([id, answer]) => `- ${id}: ${answer.trim()}`,
          ),
        ].join("\n")
      : "";

  return `## KSIC·산업 정보
${ksicBlock}

## 조사 개요
- 조사 목적: ${brief.researchPurpose.trim() || "(미입력)"}
- 응답 대상: ${brief.targetRespondent.trim() || "(미입력)"}
- 설문 주제·관심 영역: ${brief.surveyTopic.trim() || "(미입력)"}
- 추가 메모: ${brief.additionalNotes.trim() || "(없음)"}
${clarificationBlock}

위 정보를 바탕으로 설문안을 생성하거나, 부족하면 clarifications를 반환하세요.`;
}
