import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      surveyId: string;
      surveyTitle: string;
      baseUrl?: string;
    };

    if (!body.surveyId || !body.surveyTitle) {
      return NextResponse.json(
        { error: "설문 ID와 제목이 필요합니다." },
        { status: 400 },
      );
    }

    const baseUrl = body.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const surveyLink = `${baseUrl}/survey/${body.surveyId}`;

    // 이메일 설정 (환경변수에서 가져오기)
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT || "587");
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM || emailUser;

    // 환경변수 확인 및 상세 에러 메시지
    const missingVars: string[] = [];
    if (!emailHost) missingVars.push("EMAIL_HOST");
    if (!emailUser) missingVars.push("EMAIL_USER");
    if (!emailPassword) missingVars.push("EMAIL_PASSWORD");

    if (missingVars.length > 0) {
      return NextResponse.json(
        { 
          error: "이메일 서버 설정이 완료되지 않았습니다.",
          missingVariables: missingVars,
          currentSettings: {
            EMAIL_HOST: emailHost ? "설정됨" : "없음",
            EMAIL_PORT: emailPort,
            EMAIL_USER: emailUser ? "설정됨" : "없음",
            EMAIL_PASSWORD: emailPassword ? "설정됨" : "없음",
            EMAIL_FROM: emailFrom || "없음",
          }
        },
        { status: 500 },
      );
    }

    // Nodemailer 설정
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      debug: true, // 디버그 모드 활성화
      logger: true, // 로거 활성화
    });

    const supabase = getSupabaseServerClient();

    // 미발송 수신자 조회
    const { data: recipients, error: fetchError } = await supabase
      .from("survey_recipients")
      .select("*")
      .eq("survey_id", body.surveyId)
      .eq("email_sent", false);

    if (fetchError || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "발송할 수신자가 없습니다." },
        { status: 400 },
      );
    }

    // 이메일 발송 전 transporter 연결 테스트
    try {
      await transporter.verify();
      console.log("SMTP 서버 연결 성공");
    } catch (verifyError) {
      console.error("SMTP 서버 연결 실패:", verifyError);
      const error = verifyError as Error & { code?: string; response?: string; responseCode?: number; command?: string; errno?: number; syscall?: string };
      
      // Gmail 앱 비밀번호 오류 감지
      let userFriendlyError = error.message;
      let helpMessage = "";
      
      if (error.code === "EAUTH" && error.response?.includes("Application-specific password")) {
        userFriendlyError = "Gmail 앱 비밀번호가 필요합니다.";
        helpMessage = `
Gmail을 사용하려면 앱 비밀번호(Application-specific password)를 사용해야 합니다.

[해결 방법]
1. Google 계정 설정으로 이동: https://myaccount.google.com/
2. 보안 → 2단계 인증 활성화 (아직 안 했다면)
3. 보안 → 앱 비밀번호 생성
4. 생성된 16자리 앱 비밀번호를 복사
5. .env.local 파일의 EMAIL_PASSWORD에 앱 비밀번호를 설정

참고: 일반 Gmail 비밀번호는 사용할 수 없습니다.
        `.trim();
      } else if (error.code === "EAUTH") {
        userFriendlyError = "이메일 인증에 실패했습니다.";
        helpMessage = "이메일 주소와 비밀번호를 확인해주세요.";
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyError,
          helpMessage: helpMessage || undefined,
          details: {
            host: emailHost,
            port: emailPort,
            user: emailUser,
            errorCode: error.code,
            errorResponse: error.response,
            errorResponseCode: error.responseCode,
            errorCommand: error.command,
            errno: error.errno,
            syscall: error.syscall,
            fullError: String(verifyError),
          }
        },
        { status: 500 },
      );
    }

    // 이메일 발송
    const sentResults: Array<{ email: string; success: boolean; error?: string; details?: unknown }> = [];
    
    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: emailFrom,
          to: recipient.email,
          subject: `[${body.surveyTitle}] 설문조사 안내`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">${body.surveyTitle} 설문조사 안내</h2>
              <p>안녕하세요, ${recipient.name}님</p>
              <p>아래 링크를 클릭하여 설문조사에 참여해 주시기 바랍니다.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${surveyLink}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #06b6d4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  설문조사 참여하기
                </a>
              </div>
              <p style="color: #666; font-size: 12px;">이 링크는 본인만 사용 가능합니다.</p>
            </div>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`이메일 발송 성공 [${recipient.email}]:`, info.messageId);

        // 발송 완료로 업데이트
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase
          .from("survey_recipients")
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq("id", recipient.id);

        sentResults.push({ email: recipient.email, success: true });
      } catch (emailError) {
        const error = emailError as Error & { code?: string; response?: string; responseCode?: number; command?: string; errno?: number; syscall?: string };
        const errorDetails = {
          message: error.message,
          code: error.code,
          response: error.response,
          responseCode: error.responseCode,
          command: error.command,
          errno: error.errno,
          syscall: error.syscall,
          stack: error.stack,
        };
        console.error(`이메일 발송 실패 [${recipient.email}]:`, JSON.stringify(errorDetails, null, 2));
        sentResults.push({
          email: recipient.email,
          success: false,
          error: error.message || "알 수 없는 오류",
          details: errorDetails,
        });
      }
    }

    const successCount = sentResults.filter((r) => r.success).length;
    const failCount = sentResults.filter((r) => !r.success).length;
    const failedResults = sentResults.filter((r) => !r.success);

    return NextResponse.json({
      message: `이메일 발송 완료: 성공 ${successCount}건, 실패 ${failCount}건`,
      successCount,
      failCount,
      results: sentResults,
      failedDetails: failCount > 0 ? failedResults.map((r) => ({
        email: r.email,
        error: r.error,
        details: r.details,
      })) : undefined,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `예상치 못한 오류가 발생했습니다: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}

