"use client";

import { useId, useRef, useState, useTransition } from "react";
import { FileImage, FileText, Loader2 } from "lucide-react";
import { uploadSitePageAssetAction } from "@/app/actions/site-page-assets";

type Props = {
  name?: string;
  defaultValue?: string;
  rows?: number;
  pageId?: string;
  draftKey?: string;
};

export function PageBodyEditor({
  name = "page_body",
  defaultValue = "",
  rows = 8,
  pageId,
  draftKey: draftKeyProp,
}: Props) {
  const reactId = useId();
  const draftKeyRef = useRef(draftKeyProp ?? reactId.replace(/:/g, ""));
  const [body, setBody] = useState(defaultValue);
  const [imageHref, setImageHref] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const upload = (file: File, href?: string) => {
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    if (pageId) fd.append("page_id", pageId);
    fd.append("draft_key", draftKeyRef.current);
    if (href?.trim()) fd.append("image_href", href.trim());

    startTransition(async () => {
      const res = await uploadSitePageAssetAction({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.snippet) {
        setBody((prev) => `${prev}${res.snippet}`);
      }
    });
  };

  return (
    <div className="space-y-2">
      <textarea
        name={name}
        rows={rows}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono leading-relaxed"
        placeholder="텍스트를 입력하거나 아래에서 이미지·PDF를 업로드하세요."
      />
      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 space-y-2">
        <label className="block text-xs">
          <span className="font-medium text-zinc-700">
            이미지 클릭 시 이동 경로 (선택)
          </span>
          <input
            type="text"
            value={imageHref}
            onChange={(e) => setImageHref(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            placeholder="예: /p/contact 또는 /p/문의하기-페이지주소"
          />
        </label>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          문의하기 이미지처럼 클릭 시 다른 페이지로 보내려면, 위 경로를 채운 뒤 「이미지
          업로드」를 하세요. 이미 올린 이미지는 본문에서{" "}
          <code className="rounded bg-zinc-100 px-1">
            [![설명](이미지URL)](/p/이동주소)
          </code>{" "}
          형식으로 수정할 수 있습니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file, imageHref);
            e.target.value = "";
          }}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => imageInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <FileImage className="h-3.5 w-3.5" aria-hidden />
          )}
          이미지 업로드 (JPG, PNG…)
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => pdfInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <FileText className="h-3.5 w-3.5" aria-hidden />
          )}
          PDF 업로드
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        업로드 후 본문에 자동 삽입됩니다. 공개 페이지에서 이미지·PDF가 표시됩니다. (최대
        10MB)
      </p>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
