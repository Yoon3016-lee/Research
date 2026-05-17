"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

type Segment = {
  text: string;
  match: boolean;
  active?: boolean;
  key: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSegments(
  text: string,
  query: string,
  activeIndex: number,
): { segments: Segment[]; count: number } {
  const trimmed = query.trim();
  if (!trimmed) {
    return { segments: [{ text, match: false, key: "full" }], count: 0 };
  }

  const re = new RegExp(escapeRegex(trimmed), "gi");
  const segments: Segment[] = [];
  let count = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        match: false,
        key: `t-${lastIndex}`,
      });
    }
    segments.push({
      text: match[0],
      match: true,
      active: count === activeIndex,
      key: `m-${match.index}`,
    });
    count += 1;
    lastIndex = match.index + match[0].length;
    if (match[0].length === 0) {
      re.lastIndex += 1;
    }
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      match: false,
      key: `t-${lastIndex}`,
    });
  }

  return { segments, count };
}

type Props = {
  title: string;
  slug: string;
  responseScript: string;
};

export function SurveyScriptViewer({ title, slug, responseScript }: Props) {
  const hasScript = responseScript.trim().length > 0;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeMarkRef = useRef<HTMLElement | null>(null);

  const { segments, count } = useMemo(
    () => buildSegments(responseScript, query, activeIndex),
    [responseScript, query, activeIndex],
  );

  const goToMatch = useCallback(
    (direction: 1 | -1) => {
      if (count === 0) return;
      setActiveIndex((prev) => {
        const next = prev + direction;
        if (next < 0) return count - 1;
        if (next >= count) return 0;
        return next;
      });
    },
    [count],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (count === 0) return;
    if (activeIndex >= count) {
      setActiveIndex(0);
    }
  }, [activeIndex, count]);

  useEffect(() => {
    activeMarkRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex, count, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToMatch(e.shiftKey ? -1 : 1);
    }
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-700">
          스크립트 확인
        </p>
        <h1 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {title}
        </h1>
        <p className="mt-2 text-[11px] text-zinc-500">
          이 창을 설문 입력 화면 옆에 두고 참고하세요.
        </p>

        {hasScript ? (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="단어·문장 검색"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-8 text-sm outline-none ring-indigo-500/30 placeholder:text-zinc-400 focus:border-indigo-300 focus:bg-white focus:ring-2"
                aria-label="스크립트 검색"
                autoComplete="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                  aria-label="검색어 지우기"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-zinc-500" aria-live="polite">
                {query.trim() ? (
                  count > 0 ? (
                    <>
                      <span className="font-medium text-zinc-700">{count}건</span> 일치 ·{" "}
                      {activeIndex + 1}/{count}
                    </>
                  ) : (
                    <span className="text-amber-700">일치하는 내용 없음</span>
                  )
                ) : (
                  "Enter: 다음 · Shift+Enter: 이전"
                )}
              </p>
              {count > 0 ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToMatch(-1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    aria-label="이전 일치"
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToMatch(1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    aria-label="다음 일치"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {hasScript ? (
          <article className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800 shadow-sm">
            {segments.map((seg) =>
              seg.match ? (
                <mark
                  key={seg.key}
                  ref={seg.active ? (el) => { activeMarkRef.current = el; } : undefined}
                  className={
                    seg.active
                      ? "rounded-sm bg-amber-300 px-0.5 text-amber-950 ring-2 ring-amber-500/60"
                      : "rounded-sm bg-yellow-200/90 px-0.5 text-zinc-900"
                  }
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={seg.key}>{seg.text}</span>
              ),
            )}
          </article>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            등록된 응답 스크립트가 없습니다. 관리자에게 설문 편집 화면에서 스크립트 등록을
            요청해 주세요.
          </p>
        )}
      </div>

      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-2.5">
        <Link
          href={`/survey/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
        >
          설문 입력 화면 열기 →
        </Link>
      </footer>
    </main>
  );
}
