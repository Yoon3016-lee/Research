import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", id.trim())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 존재하는 ID입니다." },
        { status: 409 },
      );
    }

    // Create new user with explicit type casting
    const userData = {
      id: id.trim(),
      password: password.trim(),
      role,
    } as UserInsert;

    const { data: newUserData, error } = await supabase
      .from("users")
      .insert(userData as any)
      .select("id, role")
      .single();

    if (error || !newUserData) {
      throw new Error(error?.message ?? "회원가입에 실패했습니다.");
    }

    const newUser = newUserData as Pick<UserRow, "id" | "role">;

    return NextResponse.json(
      {
        data: {
          id: newUser.id,
          role: newUser.role,
        },
        message: "회원가입이 완료되었습니다.",
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

