"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { askAxiAction } from "@/app/actions/axi-guide";
import type { AxiMode } from "@/components/site/AxiSiteContext";

type ChatMessage = {
  id: string;
  role: "user" | "axi";
  text: string;
};

type Props = {
  mode?: AxiMode;
  surveyTitle: string;
  scriptContext: string;
  onClose: () => void;
  /** 플로팅 패널 등 부모 높이 채움 */
  embedded?: boolean;
  ksicCode?: string;
  ksicName?: string;
  axiIconUrl?: string | null;
};

function AxiAvatar({ axiIconUrl, size = "md" }: { axiIconUrl?: string | null; size?: "sm" | "md" }) {
  // 기존 md h-9/h-5, sm h-8/h-4 → ×1.3
  const dim = size === "md" ? "h-[2.925rem] w-[2.925rem]" : "h-[2.6rem] w-[2.6rem]";
  const icon = size === "md" ? "h-[1.625rem] w-[1.625rem]" : "h-5 w-5";
  if (axiIconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={axiIconUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-1 ring-zinc-200`}
      />
    );
  }
  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full bg-teal-600 text-white ring-1 ring-teal-700/20`}
      aria-hidden
    >
      <Sparkles className={icon} />
    </span>
  );
}

function welcomeText(mode: AxiMode): string {
  return mode === "survey"
    ? "이 설문의 업종·스크립트를 참고해 답합니다. 단어 뜻이나 보기 해석을 짧게 물어보세요."
    : "사이트·설문 이용이나 조사 용어를 짧게 물어보세요. 보편적인 안내를 1~2문장으로 답합니다.";
}

function placeholderText(mode: AxiMode): string {
  return mode === "survey"
    ? "예: ‘응답거절’ 보기는 어떤 때 쓰나요?"
    : "예: 설문 광장과 참여 링크의 차이는?";
}

export function AxiGuidePanel({
  mode = "general",
  surveyTitle,
  scriptContext,
  onClose,
  embedded = false,
  ksicCode = "",
  ksicName = "",
  axiIconUrl = null,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "axi",
      text: welcomeText(mode),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 설문 ↔ 일반 전환 시 안내 문구만 갱신 (대화 이력은 유지)
  useEffect(() => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    setMessages((prev) => {
      const rest = prev.filter((m) => m.id !== "welcome");
      return [{ id: "welcome", role: "axi", text: welcomeText(mode) }, ...rest];
    });
  }, [mode]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const question = draft.trim();
    if (!question || pending) return;

    const userId = `u-${Date.now()}`;
    setDraft("");
    setError(null);
    setMessages((prev) => [...prev, { id: userId, role: "user", text: question }]);

    startTransition(async () => {
      const result = await askAxiAction({
        question,
        mode,
        surveyTitle,
        scriptContext,
        ksicCode,
        ksicName,
      });
      if (!result.ok) {
        setError(result.error);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "axi",
            text: "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          },
        ]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "axi", text: result.answer },
      ]);
    });
  };

  return (
    <aside
      className={
        embedded
          ? "flex h-full min-h-0 w-full flex-col bg-white"
          : "flex h-full w-[min(100%,20rem)] shrink-0 flex-col border-l border-zinc-200 bg-white"
      }
      aria-label="AXI 가이드"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <AxiAvatar axiIconUrl={axiIconUrl} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-teal-800">AXI</p>
            {mode === "survey" && surveyTitle.trim() ? (
              <p className="truncate text-[10px] text-zinc-500" title={surveyTitle}>
                {surveyTitle}
              </p>
            ) : (
              <p className="text-[10px] text-zinc-500">사이트 안내</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="AXI 닫기"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3"
      >
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-50 px-3 py-2 text-xs leading-relaxed text-indigo-950">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <AxiAvatar axiIconUrl={axiIconUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-teal-800">AXI</p>
                <div className="mt-1 max-w-[95%] rounded-2xl rounded-tl-md bg-zinc-100 px-3 py-2 text-xs leading-relaxed text-zinc-800">
                  {m.text}
                </div>
              </div>
            </div>
          ),
        )}
        {pending ? (
          <div className="flex gap-2">
            <AxiAvatar axiIconUrl={axiIconUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-teal-800">AXI</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                답변 작성 중…
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="shrink-0 border-t border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={submit}
        className="shrink-0 border-t border-zinc-200 bg-white px-2.5 py-2.5"
      >
        <label className="sr-only" htmlFor="axi-question">
          AXI에게 질문
        </label>
        <div className="flex items-end gap-1.5">
          <textarea
            id="axi-question"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            maxLength={400}
            disabled={pending}
            placeholder={placeholderText(mode)}
            className="min-h-[2.75rem] flex-1 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs leading-relaxed outline-none ring-teal-500/25 placeholder:text-zinc-400 focus:border-teal-300 focus:bg-white focus:ring-2 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            aria-label="질문 보내기"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </form>
    </aside>
  );
}
