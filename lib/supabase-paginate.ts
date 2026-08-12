import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;
/** `in()` 절 크기·URL 한도를 피하기 위한 response_id 배치 크기 */
const RESPONSE_ID_BATCH = 200;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/** PostgREST 기본 1000행 제한을 넘는 SELECT를 페이지네이션합니다. */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    if (!data?.length) break;
    out.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return out;
}

export type SurveyResponseAnswerRow = {
  response_id: string;
  question_id: string;
  answer: unknown;
};

/** 설문 제출별 답변 행 전체 조회 (행·IN 절 모두 페이지네이션) */
export async function fetchAllSurveyResponseAnswers(
  admin: SupabaseClient,
  responseIds: string[],
): Promise<SurveyResponseAnswerRow[]> {
  if (responseIds.length === 0) return [];

  const out: SurveyResponseAnswerRow[] = [];
  for (let i = 0; i < responseIds.length; i += RESPONSE_ID_BATCH) {
    const batch = responseIds.slice(i, i + RESPONSE_ID_BATCH);
    const rows = await fetchAllPages<SurveyResponseAnswerRow>(async (from, to) =>
      admin
        .from("survey_response_answers")
        .select("response_id, question_id, answer")
        .in("response_id", batch)
        .order("response_id", { ascending: true })
        .order("question_id", { ascending: true })
        .range(from, to),
    );
    out.push(...rows);
  }
  return out;
}
