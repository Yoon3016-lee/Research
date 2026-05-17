import { Bot, Headphones, MessageCircle } from "lucide-react";
import { ServiceChatPanel } from "@/components/site/ServiceChatPanel";

export const metadata = {
  title: "서비스 | Research Hub",
  description: "챗봇 및 안내 서비스",
};

export default function ServicesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          서비스
        </h1>
        <p className="mt-2 text-zinc-600">
          참여 방법 안내·FAQ·챗봇 등 참여자 지원 기능을 한곳에 모았습니다. (UI 데모)
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800">
                <Headphones className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-zinc-900">참여 안내</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  초대 메일의 링크로 접속하거나, 조직에서 안내한 코드가 있다면 입력
                  화면에서 사용합니다. 응답은 저장 전까지 수정할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-zinc-900">문의·지원</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  기술 오류·계정 문의는 운영 시간 내 담당자 이메일로 연락 주세요. (데모
                  텍스트)
                </p>
                <p className="mt-3 text-sm font-medium text-zinc-800">
                  support@example.com · 평일 09:00–18:00
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-indigo-700 shadow-sm">
                <Bot className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-zinc-900">챗봇</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  오른쪽 패널에서 데모 대화를 시험해 보세요. 실제 서비스에서는 LLM·지식
                  베이스와 연동합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ServiceChatPanel />
        </aside>
      </div>
    </main>
  );
}
