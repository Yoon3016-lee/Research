import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type SurveyResponseInsert = Database["public"]["Tables"]["survey_responses"]["Insert"];
type SurveyResponseRow = Database["public"]["Tables"]["survey_responses"]["Row"];
type SurveyAnswerInsert = Database["public"]["Tables"]["survey_answers"]["Insert"];

export async function POST(request: Request) {
  try {
    const { surveyId, employeeId, answers } = (await request.json()) as {
      surveyId: string;
      employeeId: string;
      answers: Record<string, string | string[]>;
    };

    if (!surveyId || !employeeId || !answers) {
      return NextResponse.json(
        { error: "설문 ID, 사원 ID, 응답 데이터가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    
    const responseData = {
      survey_id: surveyId,
      employee_id: employeeId,
    } as SurveyResponseInsert;

    const { data: insertedResponseData, error: responseError } = await supabase
      .from("survey_responses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(responseData as any)
      .select("*")
      .single();

    if (responseError || !insertedResponseData) {
      throw new Error(responseError?.message ?? "응답 저장에 실패했습니다.");
    }

    const insertedResponse = insertedResponseData as SurveyResponseRow;

    const answerRows = Object.entries(answers).map(
      ([questionId, answerValue]) => {
        // 배열인 경우 쉼표로 구분된 문자열로 변환
        const answerText = Array.isArray(answerValue) 
          ? answerValue.join(",")
          : answerValue;
        return {
          response_id: insertedResponse.id,
          question_id: questionId,
          answer_text: answerText,
        } as SurveyAnswerInsert;
      }
    );

    const { error: answersError } = await supabase
      .from("survey_answers")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(answerRows as any);

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

