import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type QuestionInput = {
  prompt: string;
  type: "객관식" | "주관식";
  options?: string[];
  sortOrder?: number;
};

const shapeOptions = (options?: string[]): Json | null => {
  if (!options || options.length === 0) {
    return null;
  }
  return options;
};

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const [{ data: surveys, error: surveysError }, { data: questions, error: questionsError }, { data: responses, error: responsesError }, { data: answers, error: answersError }] =
      await Promise.all([
        supabase.from("surveys").select("*").order("created_at", { ascending: false }),
        supabase
          .from("survey_questions")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase.from("survey_responses").select("*"),
        supabase.from("survey_answers").select("*"),
      ]);

    if (surveysError || questionsError || responsesError || answersError) {
      const message =
        surveysError?.message ??
        questionsError?.message ??
        responsesError?.message ??
        answersError?.message ??
        "알 수 없는 오류";
      throw new Error(message);
    }

    const shaped = (surveys ?? []).map((survey) => {
      const surveyQuestions =
        questions?.filter((question) => question.survey_id === survey.id) ?? [];
      const surveyResponses =
        responses?.filter((response) => response.survey_id === survey.id) ?? [];

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        createdAt: survey.created_at,
        questions: surveyQuestions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          type: question.question_type as "객관식" | "주관식",
          options: Array.isArray(question.options)
            ? (question.options as string[])
            : [],
          sortOrder: question.sort_order,
        })),
        responses: surveyResponses.map((response) => {
          const responseAnswers =
            answers?.filter((answer) => answer.response_id === response.id) ??
            [];
          return {
            id: response.id,
            employee: response.employee_id,
            submittedAt: response.submitted_at,
            answers: responseAnswers.reduce<Record<string, string>>(
              (acc, answer) => {
                acc[answer.question_id] = answer.answer_text;
                return acc;
              },
              {},
            ),
          };
        }),
      };
    });

    return NextResponse.json({ data: shaped });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, questions, createdBy } = (await request.json()) as {
      title: string;
      description?: string;
      createdBy?: string;
      questions: QuestionInput[];
    };

    if (!title || !questions?.length) {
      return NextResponse.json(
        { error: "제목과 문항 정보를 모두 입력해주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: insertedSurvey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        title,
        description: description ?? null,
        created_by: createdBy ?? null,
      })
      .select("*")
      .single();

    if (surveyError || !insertedSurvey) {
      throw new Error(surveyError?.message ?? "설문 생성에 실패했습니다.");
    }

    const questionRows = questions.map((question, index) => ({
      survey_id: insertedSurvey.id,
      prompt: question.prompt,
      question_type: question.type,
      options: shapeOptions(question.options),
      sort_order: question.sortOrder ?? index,
    }));

    const { error: questionError } = await supabase
      .from("survey_questions")
      .insert(questionRows);

    if (questionError) {
      throw new Error(questionError.message);
    }

    return NextResponse.json(
      {
        data: {
          id: insertedSurvey.id,
          title: insertedSurvey.title,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

