"use client";

import { useEffect, useState } from "react";
import type {
  KsicRecommendCandidate,
  KsicRecommendUsageInfo,
} from "@/lib/survey-ai/ksic-recommend-types";
import { Loader2, X, CheckCircle2 } from "lucide-react";
import { AxiMark } from "@/components/admin/AxiMark";

type Props = {
  open: boolean;
  onClose: () => void;
  text: string;
  onTextChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  emptyMessage: string | null;
  candidates: KsicRecommendCandidate[];
  onRecommend: () => void;
  onSelectCandidate: (candidate: KsicRecommendCandidate) => void;
  /** 공개 체험 시 잔여 횟수 표시 */
  usage?: KsicRecommendUsageInfo | null;
  /** public이면 횟수·로그인 안내 강조 */
  channel?: "admin" | "public";
  axiIconUrl?: string | null;
};

export function KsicUnstructuredRecommendDialog({
  open,
  onClose,
  text,
  onTextChange,
  loading,
  error,
  emptyMessage,
  candidates,
  onRecommend,
  onSelectCandidate,
  usage = null,
  channel = "admin",
  axiIconUrl = null,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setSelectedCode(null);
  }, [open]);

  useEffect(() => {
    if (candidates.length === 0) {
      setSelectedCode(null);
      return;
    }
    if (!selectedCode || !candidates.some((c) => c.code === selectedCode)) {
      setSelectedCode(candidates[0]?.code ?? null);
    }
  }, [candidates, selectedCode]);

  if (!open) return null;

  const selected = candidates.find((c) => c.code === selectedCode) ?? null;
  const atLimit =
    channel === "public" && usage != null && usage.remaining <= 0;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-violet-950/30 p-2 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ksic-recommend-dialog-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(92vh,900px)] w-[min(98vw,1100px)] flex-col overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-b from-violet-50 via-white to-violet-50/40 shadow-2xl shadow-violet-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-violet-200/80 bg-gradient-to-r from-violet-100/90 via-violet-50 to-white px-4 py-3.5">
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="ksic-recommend-dialog-title"
                className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-violet-950 sm:text-2xl"
              >
                <span className="flex h-[4.125rem] w-[4.125rem] items-center justify-center overflow-hidden rounded-xl bg-violet-500/15 text-violet-700">
                  <AxiMark axiIconUrl={axiIconUrl} sizeClassName="h-12 w-12" />
                </span>
                비정형 데이터 후보코드 추론
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-violet-900/70">
                사업·업종 설명을 입력하면 AI가 검색어를 만들고, KSIC DB로 검증된 후보만
                표시합니다. 최종 코드는 직접 선택해 주세요.
                {channel === "public"
                  ? " 로그인 없이도 체험할 수 있으며, 브라우저(방문자) 기준으로 횟수가 제한됩니다."
                  : null}
              </p>
              {channel === "public" && usage ? (
                <p className="mt-1.5 text-xs font-medium text-violet-800">
                  체험 잔여 {usage.remaining}회 / 한도 {usage.limit}회
                  (사용 {usage.used}회)
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-violet-200/80 bg-white/80 p-1.5 text-violet-700/80 shadow-sm transition hover:bg-white hover:text-violet-900"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto border-b border-violet-100 p-4 lg:border-b-0 lg:border-r">
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">비정형 설명</span>
              <textarea
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                rows={8}
                className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="예: 카페에서 원두를 직접 로스팅하고 음료·디저트를 판매하는 소규모 커피 전문점입니다. 매장 내 취식과 테이크아웃을 함께 운영합니다."
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRecommend}
                disabled={loading || text.trim().length < 10 || atLimit}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-300 bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <AxiMark axiIconUrl={axiIconUrl} sizeClassName="h-[1.875rem] w-[1.875rem]" />
                )}
                후보 추론
              </button>
              <span className="text-[11px] text-zinc-500">10자 이상 입력</span>
            </div>

            {error ? (
              <p className="whitespace-pre-wrap rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {error}
              </p>
            ) : null}
            {emptyMessage ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {emptyMessage}
              </p>
            ) : null}

            {candidates.length > 0 ? (
              <ul className="space-y-2">
                {candidates.map((c) => {
                  const active = c.code === selectedCode;
                  return (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => setSelectedCode(c.code)}
                        className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "border-violet-400 bg-violet-50 shadow-sm"
                            : "border-zinc-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                        }`}
                      >
                        <span className="font-mono font-semibold text-indigo-800">
                          {c.code}
                        </span>{" "}
                        <span className="text-zinc-900">{c.name}</span>
                        <span className="ml-1.5 text-[10px] font-medium text-zinc-500">
                          {c.levelName}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-zinc-500">
                추론 결과가 여기 목록으로 표시됩니다. 항목을 누르면 오른쪽에서 전체
                내용을 확인할 수 있습니다.
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-col overflow-y-auto p-4">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-lg font-semibold text-indigo-900">
                    {selected.code}
                  </p>
                  <p className="mt-1 text-base font-semibold text-zinc-900">
                    {selected.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{selected.levelName}</p>
                </div>

                {selected.pathKo ? (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      분류 경로
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                      {selected.pathKo}
                    </p>
                  </section>
                ) : null}

                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    추천 근거
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-violet-900">
                    {selected.rationale}
                  </p>
                </section>

                {selected.matchedExample ? (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      포함 예시 매칭
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-sky-800">
                      {selected.matchedExample}
                    </p>
                  </section>
                ) : null}

                {selected.definition ? (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      정의
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                      {selected.definition}
                    </p>
                  </section>
                ) : null}

                {selected.examples && selected.examples.length > 0 ? (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      포함 예시
                    </h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-zinc-800">
                      {selected.examples.map((ex) => (
                        <li key={ex}>{ex}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <div className="sticky bottom-0 border-t border-violet-100 bg-gradient-to-t from-white via-white to-transparent pt-3">
                  <button
                    type="button"
                    onClick={() => onSelectCandidate(selected)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    이 분류 선택
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-6 text-center text-sm text-violet-900/70">
                후보를 선택하면 경로·근거·정의·예시를 모두 확인할 수 있습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
