"use client";

import { useCallback, useState } from "react";
import { Bot, Send } from "lucide-react";

const quickReplies = [
  "참여 링크가 안 열려요",
  "응답을 수정하고 싶어요",
  "설문 기간이 언제까지인가요?",
];

type Msg = { id: string; role: "user" | "assistant"; text: string };

const demoReply: Record<string, string> = {
  default:
    "안내드리겠습니다. 초대 메일의 링크를 복사해 브라우저 주소창에 붙여 넣어 보시고, 동일 증상이면 캡처와 함께 support@example.com 으로 보내주세요. (데모 응답)",
};

export function ServiceChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m0",
      role: "assistant",
      text: "안녕하세요. 설문 참여·기술 안내를 도와드리는 데모 챗봇입니다. 무엇을 도와드릴까요?",
    },
  ]);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(true);

  const pushAssistant = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        text,
      },
    ]);
  }, []);

  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: trimmed },
    ]);
    setInput("");
    setTimeout(() => {
      pushAssistant(demoReply.default);
    }, 400);
  }, [input, pushAssistant]);

  return (
    <div className="site-card overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 border-b border-brand-900/8 px-4 py-3 text-left sm:hidden"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          <Bot className="h-4 w-4 text-accent-600" aria-hidden />
          챗봇
        </span>
        <span className="text-xs text-brand-700/80">{expanded ? "접기" : "펼치기"}</span>
      </button>

      <div className={`${expanded ? "block" : "hidden"} sm:block`}>
        <div className="hidden items-center gap-2 border-b border-brand-900/8 px-4 py-3 sm:flex">
          <Bot className="h-4 w-4 text-accent-600" aria-hidden />
          <span className="text-sm font-semibold text-brand-900">챗봇 (데모)</span>
        </div>
        <div className="flex max-h-[min(420px,60vh)] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-to-b from-brand-800 to-brand-900 text-white"
                      : "bg-surface text-brand-900"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-900/8 p-3">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setMessages((prev) => [
                      ...prev,
                      { id: `u-${Date.now()}`, role: "user", text: q },
                    ]);
                    setTimeout(() => pushAssistant(demoReply.default), 400);
                  }}
                  className="rounded-full border border-brand-900/10 bg-surface px-3 py-1 text-xs text-brand-800 transition hover:border-accent-500/35 hover:bg-accent-500/10"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <label htmlFor="chat-input" className="sr-only">
                메시지 입력
              </label>
              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="메시지를 입력하세요"
                className="site-input min-h-10 flex-1 text-sm"
              />
              <button
                type="button"
                onClick={send}
                className="site-btn-primary inline-flex h-10 w-10 items-center justify-center p-0"
                aria-label="보내기"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
