"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteContainer } from "@/components/site/SiteContainer";

type Props = {
  slug: string;
  title: string;
};

function EmailCloseButton() {
  const close = () => {
    window.close();
  };

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={close}
        className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        닫기
      </button>
      <p className="text-xs text-zinc-500">
        버튼이 동작하지 않으면 이 창 또는 탭을 직접 닫아 주세요.
      </p>
    </div>
  );
}

export function SurveyThanksContent({ slug, title }: Props) {
  const searchParams = useSearchParams();
  const isEmail = searchParams.get("email") === "1";

  return (
    <SiteContainer as="main" width="narrow" className="py-16 sm:py-20">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-4 font-semibold text-zinc-900">응답이 제출되었습니다</h1>
        <p className="mt-2 text-zinc-600">
          「{title}」 설문에 참여해 주셔서 감사합니다.
        </p>
        {isEmail ? (
          <EmailCloseButton />
        ) : (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/surveys"
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              다른 설문 보기
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-base font-medium text-zinc-800 hover:bg-zinc-50"
            >
              홈으로
            </Link>
          </div>
        )}
      </div>
    </SiteContainer>
  );
}
