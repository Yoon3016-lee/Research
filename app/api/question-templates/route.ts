import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type QuestionTemplateInsert = Database["public"]["Tables"]["question_templates"]["Insert"];

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("question_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Question templates fetch error:", error);
      return NextResponse.json(
        { error: `템플릿을 불러오는데 실패했습니다: ${error.message}` },
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      question_type: "객관식(단일)" | "객관식(다중선택)" | "객관식(드롭다운)" | "객관식(순위선택)";
      options: string[];
    };

    if (!body.name || !body.question_type || !Array.isArray(body.options) || body.options.length === 0) {
      return NextResponse.json(
        { error: "템플릿 이름, 유형, 옵션이 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const templateData: QuestionTemplateInsert = {
      name: body.name.trim(),
      question_type: body.question_type,
      options: body.options,
    };

    // @ts-expect-error - Supabase type inference issue
    const { data, error } = await supabase
      .from("question_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error("Question template creation error:", error);
      return NextResponse.json(
        { error: `템플릿 생성에 실패했습니다: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "예상치 못한 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "템플릿 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("question_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Question template deletion error:", error);
      return NextResponse.json(
        { error: "템플릿 삭제에 실패했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "예상치 못한 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

