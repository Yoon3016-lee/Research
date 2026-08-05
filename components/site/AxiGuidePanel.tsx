"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { askAxiAction } from "@/app/actions/axi-guide";

type ChatMessage = {
  id: string;
  role: "user" | "axi";
  text: string;
};

type Props = {
  surveyTitle: string;
  scriptContext: string;
  onClose: () => void;
};

export function AxiGuidePanel({ surveyTitle, scriptContext, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "axi",
      text: "단어 뜻이나 보기 해석을 짧게 물어보세요. 1~2문장으로 답합니다.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        surveyTitle,
        scriptContext,
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
      className="flex h-full w-[min(100%,20rem)] shrink-0 flex-col border-l border-zinc-200 bg-white"
      aria-label="AXI 가이드"
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-200 px-3 py-2.5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-teal-700">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            AXI
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
            단어·보기 해석 · 짧은 답변
          </p>
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
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 py-3"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-4 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs leading-relaxed text-indigo-950"
                : "mr-2 rounded-lg bg-zinc-50 px-2.5 py-2 text-xs leading-relaxed text-zinc-800"
            }
          >
            {m.role === "axi" ? (
              <span className="mb-1 block text-[10px] font-semibold text-teal-700">AXI</span>
            ) : null}
            {m.text}
          </div>
        ))}
        {pending ? (
          <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            답변 작성 중…
          </p>
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
            placeholder="예: ‘응답거절’ 보기는 어떤 때 쓰나요?"
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
