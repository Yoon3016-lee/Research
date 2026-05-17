import Link from "next/link";

export const metadata = { title: "접근 권한 없음" };

export default function AdminUnauthorizedPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-amber-950">관리자 페이지 접근 불가</h1>
      <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
        이 계정은 <strong>총관리자</strong> 또는 <strong>서브관리자</strong> 권한이 없어
        관리자 화면에 들어갈 수 없습니다. 설문 참여는 공개 사이트에서 계속할 수 있습니다.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/surveys"
          className="inline-flex justify-center rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
        >
          진행중 설문 보기
        </Link>
        <Link
          href="/admin/login"
          className="inline-flex justify-center rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100/50"
        >
          다른 계정으로 로그인
        </Link>
      </div>
    </div>
  );
}
