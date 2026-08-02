"use client";

import { useRef, useState, useTransition } from "react";
import {
  removeSurveyQuestionMediaAction,
  uploadSurveyQuestionMediaAction,
} from "@/app/actions/survey-question-media";
import type { DraftQuestion } from "@/lib/survey-types";

type Props = {
  q: DraftQuestion;
  onChange: (patch: Partial<DraftQuestion>) => void;
};

export function InfoMediaEditFields({ q, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const upload = (file: File | null) => {
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const prevPath = q.mediaPath;
      const result = await uploadSurveyQuestionMediaAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange({
        mediaUrl: result.url,
        mediaPath: result.storagePath,
        mediaType: result.mediaType,
      });
      if (prevPath && prevPath !== result.storagePath) {
        void removeSurveyQuestionMediaAction(prevPath);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const clearMedia = () => {
    const path = q.mediaPath;
    onChange({ mediaUrl: null, mediaPath: null, mediaType: null });
    if (path) {
      startTransition(async () => {
        await removeSurveyQuestionMediaAction(path);
      });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-900">안내 내용</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          응답 입력 없이 설문 대상에게 보여 줄 글·그림·영상입니다. 본문과 미디어 중
          하나 이상 필요합니다.
        </p>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-zinc-700">안내 본문</span>
        <textarea
          value={q.infoBody}
          onChange={(e) => onChange({ infoBody: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-500/15"
          placeholder="설문 대상에게 보여줄 설명 글을 입력하세요."
        />
      </label>
      <div>
        <span className="text-sm font-medium text-zinc-700">그림 / 영상 (선택)</span>
        <p className="mt-0.5 text-xs text-zinc-500">
          이미지 10MB 이하 · 영상(MP4/WEBM/MOV) 50MB 이하
        </p>
        {q.mediaUrl ? (
          <div className="mt-2 space-y-2">
            {q.mediaType === "video" ? (
              <video
                src={q.mediaUrl}
                controls
                className="max-h-48 w-full rounded-lg border border-zinc-200 bg-black"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.mediaUrl}
                alt="미리보기"
                className="max-h-48 w-full rounded-lg border border-zinc-200 object-contain bg-white"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                파일 교체
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={clearMedia}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                미디어 제거
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="mt-2 rounded-lg border border-dashed border-rose-300 bg-white px-4 py-3 text-sm font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-60"
          >
            {pending ? "업로드 중…" : "그림 또는 영상 업로드"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0] ?? null)}
        />
        {error ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
