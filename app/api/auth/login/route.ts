import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { id, password } = (await request.json()) as {
      id: string;
      password: string;
    };

    if (!id || !password) {
      return NextResponse.json(
        { error: "ID와 비밀번호를 모두 입력해주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: userData, error } = await supabase
      .from("users")
      .select("id, password, role")
      .eq("id", id.trim())
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { error: "존재하지 않는 ID 입니다." },
        { status: 401 },
      );
    }

    // 타입 단언: Supabase의 타입 추론이 제대로 작동하지 않을 때 사용
    const user = userData as {
      id: string;
      password: string;
      role: "직원" | "관리자" | "마스터";
    };

    if (user.password !== password.trim()) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    // 저장된 계급을 자동으로 반환
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

