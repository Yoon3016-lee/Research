import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type VerificationCodeRow = Database["public"]["Tables"]["verification_codes"]["Row"];
type VerificationCodeUpdate = Database["public"]["Tables"]["verification_codes"]["Update"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

// 확인 코드 조회
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .order("role");

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ data: data as VerificationCodeRow[] });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

// 확인 코드 업데이트 (마스터만 가능)
export async function PUT(request: Request) {
  try {
    const { role, code, masterId } = (await request.json()) as {
      role: "직원" | "관리자" | "마스터";
      code: string;
      masterId: string;
    };

    if (!role || !code || !masterId) {
      return NextResponse.json(
        { error: "역할, 확인 코드, 마스터 ID를 모두 입력해주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 마스터 권한 확인
    const { data: masterUserData, error: masterError } = await supabase
      .from("users")
      .select("role")
      .eq("id", masterId.trim())
      .single();

    if (masterError || !masterUserData) {
      return NextResponse.json(
        { error: "마스터 권한이 필요합니다." },
        { status: 403 },
      );
    }

    // 타입 단언: Supabase의 타입 추론이 제대로 작동하지 않을 때 사용
    const masterUser = masterUserData as Pick<UserRow, "role">;

    if (masterUser.role !== "마스터") {
      return NextResponse.json(
        { error: "마스터 권한만 확인 코드를 변경할 수 있습니다." },
        { status: 403 },
      );
    }

    // 확인 코드 업데이트
    const updateData: VerificationCodeUpdate = {
      code: code.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedData, error: updateError } = await supabase
      .from("verification_codes")
      // @ts-expect-error - Supabase 타입 추론 제한으로 인한 필요
      .update(updateData)
      .eq("role", role)
      .select("*")
      .single();

    if (updateError || !updatedData) {
      throw new Error(updateError?.message ?? "확인 코드 업데이트에 실패했습니다.");
    }

    return NextResponse.json({
      data: updatedData as VerificationCodeRow,
      message: "확인 코드가 성공적으로 변경되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

