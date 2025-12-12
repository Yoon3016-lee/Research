import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

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


