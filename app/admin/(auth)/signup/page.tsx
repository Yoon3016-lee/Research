import { SignupForm } from "@/components/admin/SignupForm";

export const metadata = { title: "관리자 회원가입" };

export default async function AdminSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">관리자 회원가입</h1>
      <p className="mt-1 text-sm text-zinc-600">
        조직에서 안내한 <strong className="font-medium text-zinc-800">관리자 가입키</strong>가 있어야
        가입할 수 있습니다. 첫 번째로 가입하는 계정은 자동으로{" "}
        <strong className="font-medium text-zinc-800">총관리자</strong>로 설정됩니다.
      </p>
      <div className="mt-6">
        <SignupForm nextPath={nextPath} />
      </div>
    </div>
  );
}
