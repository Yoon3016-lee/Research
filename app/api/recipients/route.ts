import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import * as XLSX from "xlsx";

type SurveyRecipientInsert = Database["public"]["Tables"]["survey_recipients"]["Insert"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const surveyId = formData.get("surveyId") as string | null;

    if (!file || !surveyId) {
      return NextResponse.json(
        { error: "파일과 설문 ID가 필요합니다." },
        { status: 400 },
      );
    }

    // 엑셀 파일 읽기
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    // 헤더 검증 (첫 번째 행: A=이름, B=이메일)
    if (data.length < 2) {
      return NextResponse.json(
        { error: "엑셀 파일에 데이터가 없습니다. 최소 2행(헤더 + 1개 데이터)이 필요합니다." },
        { status: 400 },
      );
    }

    const recipients: Array<{ name: string; email: string }> = [];
    
    // 2행부터 데이터 읽기 (1행은 헤더)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;

      const name = String(row[0] || "").trim();
      const email = String(row[1] || "").trim();

      // 이메일 유효성 검사
      if (name && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        recipients.push({ name, email });
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "유효한 이름과 이메일이 없습니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 기존 수신자 삭제 (중복 방지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("survey_recipients").delete().eq("survey_id", surveyId);

    // 수신자 추가
    const recipientsData: SurveyRecipientInsert[] = recipients.map((recipient) => ({
      survey_id: surveyId,
      name: recipient.name,
      email: recipient.email,
      email_sent: false,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedData, error } = await supabase
      .from("survey_recipients")
      .insert(recipientsData as any)
      .select();

    if (error) {
      console.error("Recipients insertion error:", error);
      return NextResponse.json(
        { error: `수신자 저장에 실패했습니다: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: `${recipients.length}명의 수신자가 저장되었습니다.`,
      count: recipients.length,
      data: insertedData,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `예상치 못한 오류가 발생했습니다: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get("surveyId");

    if (!surveyId) {
      return NextResponse.json(
        { error: "설문 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("survey_recipients")
      .select("*")
      .eq("survey_id", surveyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Recipients fetch error:", error);
      return NextResponse.json(
        { error: `수신자 목록을 불러오는데 실패했습니다: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "예상치 못한 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

