import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type QuestionInput = {
  id?: string;
  prompt: string;
  type: string; // "객관식(단일)" | "객관식(다중선택)" | ... 등 다양한 유형
  options?: string[];
  sortOrder?: number;
  conditionalLogic?: Record<string, string>; // { "옵션": "타겟질문ID" }
};

type SurveyQuestionInsert = Database["public"]["Tables"]["survey_questions"]["Insert"];
type SurveyUpdate = Database["public"]["Tables"]["surveys"]["Update"];

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "설문 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 설문 삭제 (CASCADE로 인해 관련된 questions, responses, answers도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("surveys")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(deleteError.message ?? "설문 삭제에 실패했습니다.");
    }

    return NextResponse.json(
      {
        data: {
          message: "설문이 삭제되었습니다.",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "설문 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const { title, description, questions } = (await request.json()) as {
      title: string;
      description?: string | null;
      questions: QuestionInput[];
    };

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "제목과 최소 1개 이상의 문항이 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 설문 메타 업데이트
    const surveyData: SurveyUpdate = {
      title,
      description: description ?? null,
    };

    const { error: updateSurveyError } = await supabase
      .from("surveys")
      .update(surveyData)
      .eq("id", id);

    if (updateSurveyError) {
      throw new Error(updateSurveyError.message);
    }

    const questionIds = questions
      .map((q) => q.id)
      .filter(Boolean) as string[];

    // 기존 문항 중 전달되지 않은 것만 삭제
    if (questionIds.length > 0) {
      const { error: deleteQuestionsError } = await supabase
        .from("survey_questions")
        .delete()
        .eq("survey_id", id)
        .not("id", "in", `(${questionIds.join(",")})`);

      if (deleteQuestionsError) {
        throw new Error(deleteQuestionsError.message);
      }
    } else {
      // 모두 교체하는 경우
      const { error: deleteQuestionsError } = await supabase
        .from("survey_questions")
        .delete()
        .eq("survey_id", id);

      if (deleteQuestionsError) {
        throw new Error(deleteQuestionsError.message);
      }
    }

    const shapeConditionalLogic = (logic?: Record<string, string>): Json | null => {
      if (!logic || Object.keys(logic).length === 0) {
        return null;
      }
      return logic;
    };

    // 새 문항 upsert (기존 id 유지, 없으면 새로 삽입)
    const questionRows: SurveyQuestionInsert[] = questions.map(
      (question, index) => ({
        id: question.id, // 기존 문항이면 id 유지
        survey_id: id,
        prompt: question.prompt,
        question_type: question.type,
        options:
          question.type === "객관식"
            ? (question.options ?? [])
            : null,
        conditional_logic: shapeConditionalLogic(question.conditionalLogic),
        sort_order: question.sortOrder ?? index,
      }),
    );

    const { error: upsertQuestionsError } = await supabase
      .from("survey_questions")
      // @ts-expect-error Supabase 타입 제한
      .upsert(questionRows, { onConflict: "id" });

    if (upsertQuestionsError) {
      throw new Error(upsertQuestionsError.message);
    }

    return NextResponse.json({ message: "설문이 수정되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
