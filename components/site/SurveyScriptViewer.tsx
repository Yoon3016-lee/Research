"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown, ChevronUp, Search, Sparkles, X } from "lucide-react";
import type { SharedResponseScript } from "@/lib/shared-scripts";
import { AxiGuidePanel } from "@/components/site/AxiGuidePanel";

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

function formatSharedScriptsBody(scripts: SharedResponseScript[]): string {
  return scripts
    .map((s) => `\u25B8 ${s.title}\n${s.body.trim() || "(본문 없음)"}`)
    .join("\n\n");
}

function buildFullScriptDocument(
  responseScript: string,
  sharedScripts: SharedResponseScript[],
): string {
  const parts: string[] = [];

  if (responseScript.trim()) {
    parts.push(`【이 설문 스크립트】\n${responseScript.trim()}`);
  }

  if (sharedScripts.length > 0) {
    parts.push(`【공용 스크립트】\n${formatSharedScriptsBody(sharedScripts)}`);
  }

  return parts.join("\n\n");
}

function HighlightedBody({
  content,
  query,
  activeIndex,
  activeMarkRef,
}: {
  content: string;
  query: string;
  activeIndex: number;
  activeMarkRef: React.MutableRefObject<HTMLElement | null>;
}) {
  const { segments } = useMemo(
    () => buildSegments(content, query, activeIndex),
    [content, query, activeIndex],
  );

  return (
    <article className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
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
  );
}

const ADVISOR_WIDTH = 440;
const AXI_PANEL_WIDTH = 320;
const POPUP_HEIGHT = 580;

function resizeAdvisorPopup(axiOpen: boolean) {
  if (typeof window === "undefined") return;
  try {
    const width = axiOpen ? ADVISOR_WIDTH + AXI_PANEL_WIDTH : ADVISOR_WIDTH;
    const height = Math.min(POPUP_HEIGHT, window.screen.availHeight - 40);
    const targetW = Math.min(width + 16, window.screen.availWidth);
    window.resizeTo(targetW, height);
  } catch {
    /* popup resize may be blocked */
  }
}

type Props = {
  title: string;
  slug: string;
  responseScript: string;
  sharedScripts: SharedResponseScript[];
};

export function SurveyScriptViewer({
  title,
  responseScript,
  sharedScripts,
}: Props) {
  const fullDocument = useMemo(
    () => buildFullScriptDocument(responseScript, sharedScripts),
    [responseScript, sharedScripts],
  );
  const hasContent = fullDocument.trim().length > 0;

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [axiOpen, setAxiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeMarkRef = useRef<HTMLElement | null>(null);

  const { count } = useMemo(
    () => buildSegments(fullDocument, query, activeIndex),
    [fullDocument, query, activeIndex],
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

  useEffect(() => {
    resizeAdvisorPopup(axiOpen);
  }, [axiOpen]);

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

  const toggleAxi = () => {
    setAxiOpen((open) => !open);
  };

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden">
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 shrink-0 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-medium tracking-wide text-indigo-700">
            Advisor Agent
          </p>
          <h1 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
            {title}
          </h1>
          <p className="mt-2 text-[11px] text-zinc-500">
            위에서부터 이 설문 스크립트, 이어서 공용 스크립트가 표시됩니다.
          </p>

          {hasContent ? (
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
                  placeholder="단어·문장 검색 (설문·공용 전체)"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-8 text-sm outline-none ring-indigo-500/30 placeholder:text-zinc-400 focus:border-indigo-300 focus:bg-white focus:ring-2"
                  aria-label="Advisor Agent 검색"
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {hasContent ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <HighlightedBody
                content={fullDocument}
                query={query}
                activeIndex={activeIndex}
                activeMarkRef={activeMarkRef}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              등록된 스크립트가 없습니다. 관리자에게 설문·공용 스크립트 등록을 요청해 주세요.
            </p>
          )}
        </div>

        <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-2.5">
          <button
            type="button"
            onClick={toggleAxi}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              axiOpen
                ? "border border-teal-300 bg-teal-50 text-teal-900"
                : "border border-teal-200 bg-teal-600 text-white hover:bg-teal-700"
            }`}
            aria-expanded={axiOpen}
            aria-controls="axi-guide-panel"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {axiOpen ? "AXI 닫기" : "AXI 열기"}
          </button>
        </footer>
      </main>

      {axiOpen ? (
        <div id="axi-guide-panel" className="contents">
          <AxiGuidePanel
            surveyTitle={title}
            scriptContext={fullDocument}
            onClose={() => setAxiOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
