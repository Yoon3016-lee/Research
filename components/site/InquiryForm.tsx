"use client";

import { useActionState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitSiteInquiryAction, type SiteInquiryActionState } from "@/app/actions/site-inquiries";
import {
  SITE_INQUIRY_TYPE_LABELS,
  type SiteInquiryType,
} from "@/lib/site-inquiry-types";

const initial: SiteInquiryActionState = {};

type Props = {
  defaultType: SiteInquiryType;
};

export function InquiryForm({ defaultType }: Props) {
  const [state, formAction, pending] = useActionState(submitSiteInquiryAction, initial);

  useEffect(() => {
    if (state.ok) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.ok]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold text-emerald-950">문의가 접수되었습니다</h2>
        <p className="mt-2 text-emerald-900/90">
          담당자가 내용을 확인한 뒤 입력하신 연락처로 회신드리겠습니다.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-brand-900">문의 유형</legend>
        <div className="flex flex-wrap gap-3">
          {(["survey", "service"] as const).map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-brand-900/10 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 shadow-sm has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-950"
            >
              <input
                type="radio"
                name="inquiry_type"
                value={type}
                defaultChecked={defaultType === type}
                className="accent-sky-600"
              />
              {SITE_INQUIRY_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-brand-900">이름 *</span>
          <input
            name="name"
            required
            autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-brand-900/10 px-3 py-2.5 text-brand-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-brand-900">소속·기관</span>
          <input
            name="organization"
            autoComplete="organization"
            className="mt-1.5 w-full rounded-xl border border-brand-900/10 px-3 py-2.5 text-brand-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-brand-900">이메일 *</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-brand-900/10 px-3 py-2.5 text-brand-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-brand-900">연락처</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1.5 w-full rounded-xl border border-brand-900/10 px-3 py-2.5 text-brand-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            placeholder="010-0000-0000"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-brand-900">문의 제목 *</span>
        <input
          name="subject"
          required
          className="mt-1.5 w-full rounded-xl border border-brand-900/10 px-3 py-2.5 text-brand-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-brand-900">문의 내용 *</span>
        <textarea
          name="message"
          required
          rows={8}
          className="mt-1.5 w-full rounded-xl border border-brand-900/10 px-3 py-2.5 text-brand-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          placeholder="조사·서비스 문의 내용을 구체적으로 작성해 주세요."
        />
      </label>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="site-btn-primary w-full justify-center py-3 text-base disabled:opacity-60 sm:w-auto sm:min-w-[10rem]"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            접수 중…
          </>
        ) : (
          "문의 접수"
        )}
      </button>
    </form>
  );
}
