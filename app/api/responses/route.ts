import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { surveyId, employeeId, answers } = (await request.json()) as {
      surveyId: string;
      employeeId: string;
      answers: Record<string, string>;
    };

    if (!surveyId || !employeeId || !answers) {
      return NextResponse.json(
        { error: "설문 ID, 사원 ID, 응답 데이터가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: insertedResponse, error: responseError } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: surveyId,
        employee_id: employeeId,
      })
      .select("*")
      .single();

    if (responseError || !insertedResponse) {
      throw new Error(responseError?.message ?? "응답 저장에 실패했습니다.");
    }

    const answerRows = Object.entries(answers).map(
      ([questionId, answerText]) => ({
        response_id: insertedResponse.id,
        question_id: questionId,
        answer_text: answerText,
      }),
    );

    const { error: answersError } = await supabase
      .from("survey_answers")
      .insert(answerRows);

    if (answersError) {
      throw new Error(answersError.message);
    }

    return NextResponse.json(
      {
        data: {
          responseId: insertedResponse.id,
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

