import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type SurveyRow = Database["public"]["Tables"]["surveys"]["Row"];
type SurveyInsert = Database["public"]["Tables"]["surveys"]["Insert"];
type SurveyQuestionRow = Database["public"]["Tables"]["survey_questions"]["Row"];
type SurveyQuestionInsert = Database["public"]["Tables"]["survey_questions"]["Insert"];
type SurveyResponseRow = Database["public"]["Tables"]["survey_responses"]["Row"];
type SurveyAnswerRow = Database["public"]["Tables"]["survey_answers"]["Row"];

type QuestionInput = {
  prompt: string;
  type: string; // "객관식(단일)" | "객관식(다중선택)" | ... 등 다양한 유형
  options?: string[];
  sortOrder?: number;
  conditionalLogic?: Record<string, string>; // { "옵션": "타겟질문ID" }
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

    const [
      { data: surveysData, error: surveysError },
      { data: questionsData, error: questionsError },
      { data: responsesData, error: responsesError },
      { data: answersData, error: answersError },
    ] = await Promise.all([
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

    const surveys = (surveysData ?? []) as SurveyRow[];
    const questions = (questionsData ?? []) as SurveyQuestionRow[];
    const responses = (responsesData ?? []) as SurveyResponseRow[];
    const answers = (answersData ?? []) as SurveyAnswerRow[];

    const shaped = surveys.map((survey) => {
      const surveyQuestions = questions.filter(
        (question) => question.survey_id === survey.id,
      );
      const surveyResponses = responses.filter(
        (response) => response.survey_id === survey.id,
      );

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
          conditionalLogic: question.conditional_logic
            ? (question.conditional_logic as Record<string, string>)
            : undefined,
        })),
        responses: surveyResponses.map((response) => {
          const responseAnswers = answers.filter(
            (answer) => answer.response_id === response.id,
          );
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
    
    const surveyData = {
      title,
      description: description ?? null,
      created_by: createdBy ?? null,
    } as SurveyInsert;

    const { data: insertedSurveyData, error: surveyError } = await supabase
      .from("surveys")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(surveyData as any)
      .select("*")
      .single();

    if (surveyError || !insertedSurveyData) {
      throw new Error(surveyError?.message ?? "설문 생성에 실패했습니다.");
    }

    const insertedSurvey = insertedSurveyData as SurveyRow;

    const shapeConditionalLogic = (logic?: Record<string, string>): Json | null => {
      if (!logic || Object.keys(logic).length === 0) {
        return null;
      }
      return logic;
    };

    const questionRows = questions.map((question, index) =>
      ({
        survey_id: insertedSurvey.id,
        prompt: question.prompt,
        question_type: question.type,
        options: shapeOptions(question.options),
        conditional_logic: shapeConditionalLogic(question.conditionalLogic),
        sort_order: question.sortOrder ?? index,
      }) as SurveyQuestionInsert,
    );

    const { error: questionError } = await supabase
      .from("survey_questions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(questionRows as any);

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

