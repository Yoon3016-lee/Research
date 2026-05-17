import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "로그인" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { next, notice } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">관리자 로그인</h1>
      <p className="mt-1 text-sm text-zinc-600">
        아이디는 이메일 주소를 사용합니다. 가입키는 회원가입 시에만 필요합니다.
      </p>
      {notice === "confirm-email" ? (
        <p className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          이메일 인증이 필요한 경우, 받은 편지함의 링크를 누른 뒤 여기서 로그인하세요.
        </p>
      ) : null}
      {notice === "forbidden" ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          이 계정으로는 관리자 페이지에 접근할 수 없습니다. 총관리자·서브관리자 계정으로
          로그인해 주세요.
        </p>
      ) : null}
      {notice === "supabase-unavailable" ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Supabase에 연결되지 않습니다.{" "}
          <code className="rounded bg-amber-100/80 px-1">.env.local</code>의{" "}
          <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code>
          이 대시보드 Project URL과 같은지, 프로젝트가 일시 중지되지 않았는지 확인하세요.
        </p>
      ) : null}
      <div className="mt-6">
        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
