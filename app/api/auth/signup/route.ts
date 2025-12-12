import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type VerificationCodeRow = Database["public"]["Tables"]["verification_codes"]["Row"];

export async function POST(request: Request) {
  try {
    const { id, password, role, verificationCode } = (await request.json()) as {
      id: string;
      password: string;
      role: "직원" | "관리자" | "마스터";
      verificationCode?: string;
    };

    if (!id || !password || !role) {
      return NextResponse.json(
        { error: "ID, 비밀번호, 역할을 모두 입력해주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 모든 역할에서 확인 코드 검증
    if (!verificationCode) {
      return NextResponse.json(
        { error: `${role} 회원가입을 위해서는 확인 코드가 필요합니다.` },
        { status: 400 },
      );
    }

    // 확인 코드 조회
    const { data: codeData, error: codeError } = await supabase
      .from("verification_codes")
      .select("code")
      .eq("role", role)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json(
        { error: "확인 코드를 확인할 수 없습니다." },
        { status: 500 },
      );
    }

    // 타입 단언: Supabase의 타입 추론이 제대로 작동하지 않을 때 사용
    const verificationCodeData = codeData as Pick<VerificationCodeRow, "code">;

    // 확인 코드 검증
    if (verificationCodeData.code !== verificationCode.trim()) {
      return NextResponse.json(
        { error: "확인 코드가 일치하지 않습니다." },
        { status: 403 },
      );
    }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

