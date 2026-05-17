import { AdminHeader } from "@/components/admin/AdminHeader";
import { Send } from "lucide-react";

export const metadata = { title: "이메일 발송" };

export default function AdminEmailsPage() {
  return (
    <>
      <AdminHeader
        title="이메일 발송"
        description="초대·리마인드 메일을 발송·예약합니다. 실제 발송은 SMTP 연동 후 설정합니다."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">빠른 발송</h2>
          <p className="mt-1 text-sm text-zinc-600">
            수신자·제목·본문을 입력하면 캠페인으로 저장하는 흐름을 연동할 예정입니다.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">캠페인 이름</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-indigo-500/30 focus:ring-2"
                placeholder="예: 2차 리마인드"
                defaultValue=""
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">총 수신자</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-indigo-500/30 focus:ring-2"
                placeholder="0"
                type="number"
                defaultValue=""
              />
            </label>
          </div>
          <div className="mt-4">
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">본문 요약</span>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-indigo-500/30 focus:ring-2"
                placeholder="참여 링크와 안내 문구를 입력하세요."
                defaultValue=""
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" aria-hidden />
              발송 예약
            </button>
            <button
              type="button"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              초안 저장
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">최근 캠페인</h2>
          </div>
          <p className="px-4 py-10 text-center text-sm text-zinc-600">
            등록된 이메일 캠페인이 없습니다.
          </p>
        </div>
      </div>
    </>
  );
}
