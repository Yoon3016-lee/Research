import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { id, password, role } = (await request.json()) as {
      id: string;
      password: string;
      role: "직원" | "관리자" | "마스터";
    };

    if (!id || !password || !role) {
      return NextResponse.json(
        { error: "ID, 비밀번호, 역할을 모두 입력해주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id.trim())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "존재하지 않는 ID 입니다." },
        { status: 401 },
      );
    }

    if (user.password !== password.trim()) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    if (user.role !== role) {
      return NextResponse.json(
        { error: "선택한 사원 계급과 등록 정보가 다릅니다." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      data: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

