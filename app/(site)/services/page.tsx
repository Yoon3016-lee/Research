import { Bot, Headphones, MessageCircle } from "lucide-react";
import { SiteContainer } from "@/components/site/SiteContainer";
import { ServiceChatPanel } from "@/components/site/ServiceChatPanel";

export const metadata = {
  title: "서비스 | Research Hub",
  description: "챗봇 및 안내 서비스",
};

export default function ServicesPage() {
  return (
    <SiteContainer as="main" className="py-10 sm:py-12 lg:py-14">
      <div className="max-w-3xl">
        <p className="site-eyebrow">Support</p>
        <h1 className="mt-3">서비스</h1>
        <p className="mt-3 text-brand-700">
          참여 방법 안내·FAQ·챗봇 등 참여자 지원 기능을 한곳에 모았습니다. (UI 데모)
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
        <section className="space-y-6">
          <div className="site-card">
            <div className="flex items-start gap-4">
              <span className="site-icon-badge">
                <Headphones className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold">참여 안내</h2>
                <p className="mt-2 text-brand-700">
                  초대 메일의 링크로 접속하거나, 조직에서 안내한 코드가 있다면 입력
                  화면에서 사용합니다. 응답은 저장 전까지 수정할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="site-card">
            <div className="flex items-start gap-4">
              <span className="site-icon-badge">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold">문의·지원</h2>
                <p className="mt-2 text-brand-700">
                  기술 오류·계정 문의는 운영 시간 내 담당자 이메일로 연락 주세요. (데모
                  텍스트)
                </p>
                <p className="mt-3 font-medium text-brand-900">
                  support@example.com · 평일 09:00–18:00
                </p>
              </div>
            </div>
          </div>

          <div className="site-card border-dashed border-accent-500/30 bg-gradient-to-br from-accent-500/8 to-transparent">
            <div className="flex items-start gap-4">
              <span className="site-icon-badge bg-white">
                <Bot className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold">챗봇</h2>
                <p className="mt-2 text-brand-700">
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
    </SiteContainer>
  );
}
