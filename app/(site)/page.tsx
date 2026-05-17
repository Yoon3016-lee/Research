import Link from "next/link";
import { ArrowRight, BarChart3, Mail, ShieldCheck } from "lucide-react";

const highlights = [
  {
    title: "진행중인 설문 한눈에",
    desc: "기간·목표 응답·상태를 카드로 확인하고 참여 링크로 바로 이동합니다.",
    icon: BarChart3,
  },
  {
    title: "챗봇·안내 서비스",
    desc: "참여 방법·문의 FAQ를 빠르게 안내합니다. (서비스 메뉴에서 이용)",
    icon: Mail,
  },
  {
    title: "상업적 운영을 고려한 구조",
    desc: "관리자 영역에서 배포·이메일·진행도·업무 현황을 통합 관리할 수 있습니다.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-zinc-200 bg-linear-to-b from-white to-zinc-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(79,70,229,0.12),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium text-indigo-700">
            기업·기관용 리서치·설문조사
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            응답 수집부터 운영·분석까지,
            <span className="text-indigo-700"> 한 플랫폼</span>에서.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            참여자는 상단 메뉴로 진행중 설문·챗봇 등 서비스를 이용하고, 운영팀은
            관리자 화면에서 설문·이메일·진행도·업무 현황을 관리합니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/surveys"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              진행중 설문 보기
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              서비스 안내
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-lg font-semibold text-zinc-900">메인 화면에서 할 수 있는 일</h2>
        <p className="mt-1 text-sm text-zinc-600">
          상단 탭으로 이동하며 진행중 설문·챗봇 등을 이용할 수 있습니다.
        </p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {highlights.map(({ title, desc, icon: Icon }) => (
            <li
              key={title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-zinc-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
