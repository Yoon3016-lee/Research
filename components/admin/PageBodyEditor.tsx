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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const upload = (file: File) => {
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    if (pageId) fd.append("page_id", pageId);
    fd.append("draft_key", draftKeyRef.current);

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
        placeholder={"\ud14d\uc2a4\ud2b8\ub97c \uc785\ub825\ud558\uac70\ub098 \uc544\ub798\uc11c \uc774\ubbf8\uc9c0\u00b7PDF\ub97c \uc5c5\ub85c\ub4dc\ud558\uc138\uc694."}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
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
          {"\uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc (JPG, PNG\u2026)"}
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
          PDF {"\uc5c5\ub85c\ub4dc"}
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        {"\uc5c5\ub85c\ub4dc \ud6c4 \ubcf8\ubb38\uc5d0 \uc790\ub3d9 \uc0bd\uc785\ub429\ub2c8\ub2e4. \uacf5\uac1c \ud398\uc774\uc9c0\uc5d0\uc11c \uc774\ubbf8\uc9c0\u00b7PDF\uac00 \ud45c\uc2dc\ub429\ub2c8\ub2e4. (\ucd5c\ub300 10MB)"}
      </p>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
