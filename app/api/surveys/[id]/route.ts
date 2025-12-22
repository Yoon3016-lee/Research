import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type QuestionInput = {
  id?: string;
  prompt: string;
  type: string; // "객관식(단일)" | "객관식(다중선택)" | ... 등 다양한 유형
  options?: string[];
  sortOrder?: number;
  conditionalLogic?: Record<string, string>; // { "옵션": "타겟질문ID" }
  maxRank?: number;
  maxSelected?: number;
};

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

    const { title, description, imageUrl, questions, deletedAt } = (await request.json()) as {
      title?: string;
      description?: string | null;
      imageUrl?: string | null;
      questions?: QuestionInput[];
      deletedAt?: string | null;
    };

    const supabase = getSupabaseServerClient();

    // deletedAt만 업데이트하는 경우 (soft delete/restore)
    if (deletedAt !== undefined && title === undefined && questions === undefined) {
      const surveyData: SurveyUpdate = {
        deleted_at: deletedAt,
      };

      const { error: updateSurveyError } = await supabase
        .from("surveys")
        // @ts-expect-error - Supabase type inference issue
        .update(surveyData)
        .eq("id", id);

      if (updateSurveyError) {
        throw new Error(updateSurveyError.message);
      }

      return NextResponse.json({ 
        message: deletedAt ? "설문이 삭제되었습니다." : "설문이 복원되었습니다." 
      });
    }

    // 일반 업데이트 (title, description, questions)
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "제목과 최소 1개 이상의 문항이 필요합니다." },
        { status: 400 },
      );
    }

    // 설문 메타 업데이트
    const surveyData = {
      title,
      description: description ?? null,
      image_url: imageUrl ?? null,
    };

      const { error: updateSurveyError } = await supabase
        .from("surveys")
        // @ts-expect-error - Supabase type inference issue with image_url
        .update(surveyData)
        .eq("id", id);

    if (updateSurveyError) {
      throw new Error(updateSurveyError.message);
    }

    const questionIds = questions
      .map((q) => q.id)
      .filter((id) => id && !id.startsWith("temp-")) as string[];

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

    const shapeConditionalLogic = (question: QuestionInput): Json | null => {
      const base = question.conditionalLogic ?? {};
      const logic: Record<string, string> = { ...base };

      if (question.type === "객관식(순위선택)" && typeof question.maxRank === "number") {
        logic.__maxRank = String(question.maxRank);
      }

      if (question.type === "객관식(다중선택)" && typeof question.maxSelected === "number") {
        logic.__maxSelected = String(question.maxSelected);
      }

      if (Object.keys(logic).length === 0) {
        return null;
      }

      return logic;
    };

    // 새 문항과 기존 문항 분리
    const shapeOptions = (options?: string[]): Json | null => {
      if (!options || options.length === 0) {
        return null;
      }
      return options as Json;
    };

    const existingQuestions = questions.filter((q) => q.id && !q.id.startsWith("temp-"));
    const newQuestions = questions.filter((q) => !q.id || q.id.startsWith("temp-"));

    // 기존 문항 업데이트 (upsert)
    if (existingQuestions.length > 0) {
      const existingQuestionRows = existingQuestions.map((question, index) => ({
        id: question.id,
        survey_id: id,
        prompt: question.prompt,
        question_type: question.type,
        options:
          question.type.startsWith("객관식") || question.type === "복수형 주관식"
            ? shapeOptions(question.options)
            : null,
        conditional_logic: shapeConditionalLogic(question),
        sort_order: question.sortOrder ?? index,
      }));

      const { error: upsertError } = await supabase
        .from("survey_questions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(existingQuestionRows as any, { onConflict: "id" });

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    // 새 문항 삽입 (insert)
    if (newQuestions.length > 0) {
      const newQuestionRows = newQuestions.map((question, index) => ({
        survey_id: id,
        prompt: question.prompt,
        question_type: question.type,
        options:
          question.type.startsWith("객관식") || question.type === "복수형 주관식"
            ? shapeOptions(question.options)
            : null,
        conditional_logic: shapeConditionalLogic(question),
        sort_order: question.sortOrder ?? (existingQuestions.length + index),
      }));

      const { error: insertError } = await supabase
        .from("survey_questions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(newQuestionRows as any);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return NextResponse.json({ message: "설문이 수정되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
