import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드 가능합니다." },
        { status: 400 },
      );
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 고유한 파일명 생성
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName; // 버킷 내 경로 (폴더 구조 없이)

    // Supabase Storage에 업로드 (서비스 롤 키는 RLS를 우회해야 함)
    let uploadData;
    const { data: initialUploadData, error: uploadError } = await supabase.storage
      .from("survey-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });
    
    uploadData = initialUploadData;

    // 버킷이 없으면 생성 시도
    if (uploadError && (uploadError.message.includes("Bucket not found") || uploadError.message.includes("not found"))) {
      try {
        // Supabase Management API를 사용하여 버킷 생성 시도
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
        }

        // Management API를 통한 버킷 생성
        const projectRef = supabaseUrl.split("//")[1]?.split(".")[0];
        const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/storage/buckets`;

        const createBucketResponse = await fetch(managementUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            "apikey": serviceRoleKey,
          },
          body: JSON.stringify({
            id: "survey-images",
            name: "survey-images",
            public: true,
            file_size_limit: 5242880, // 5MB
            allowed_mime_types: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"],
          }),
        });

        if (!createBucketResponse.ok) {
          const errorData = await createBucketResponse.json().catch(() => ({}));
          console.error("Bucket creation error:", errorData);
          
          // 버킷이 이미 존재하는 경우도 처리
          if (createBucketResponse.status === 409 || errorData.message?.includes("already exists")) {
            // 버킷이 이미 존재하므로 업로드 재시도
            const retryResult = await supabase.storage
              .from("survey-images")
              .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
              });

            if (retryResult.error) {
              throw new Error(retryResult.error.message);
            }

            uploadData = retryResult.data;
          } else {
            // 버킷 생성 실패 시 상세 안내 제공
            return NextResponse.json(
              {
                error:
                  "이미지 저장소가 설정되지 않았습니다. 다음 단계를 따라주세요:\n\n1. Supabase 대시보드 접속 (https://supabase.com/dashboard)\n2. 프로젝트 선택\n3. Storage 메뉴로 이동\n4. 'Create a new bucket' 클릭\n5. 버킷 이름: survey-images\n6. Public bucket 체크\n7. 생성 완료",
                details: errorData.message || "버킷 생성에 실패했습니다.",
              },
              { status: 500 },
            );
          }
        } else {
          // 버킷 생성 성공 후 업로드 재시도
          const retryResult = await supabase.storage
            .from("survey-images")
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: false,
            });

          if (retryResult.error) {
            throw new Error(retryResult.error.message);
          }

          uploadData = retryResult.data;
        }
      } catch (createError) {
        console.error("Bucket creation/retry error:", createError);
        return NextResponse.json(
          {
            error:
              "이미지 저장소 설정에 실패했습니다. Supabase 대시보드 > Storage에서 'survey-images' 버킷을 Public으로 생성해주세요.",
            details: (createError as Error).message,
          },
          { status: 500 },
        );
      }
    } else if (uploadError) {
      throw new Error(uploadError.message);
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from("survey-images").getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "이미지 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}

