"use client";

import { useEffect } from "react";
import {
  getSiteNameFontOption,
  parseSiteNameFontKey,
  SITE_NAME_FONT_OPTIONS,
  type SiteNameFontKey,
} from "@/lib/site-name-fonts";

type Props = {
  fontKey: SiteNameFontKey;
  onFontChange: (key: SiteNameFontKey) => void;
  previewText: string;
};

function useGoogleFont(href: string | null) {
  useEffect(() => {
    if (!href || typeof document === "undefined") return;
    const id = `site-name-font-preview-${href}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}

export function SiteNameFontField({ fontKey, onFontChange, previewText }: Props) {
  const option = getSiteNameFontOption(fontKey);
  useGoogleFont(option.googleHref);

  return (
    <div className="space-y-3">
      <input type="hidden" name="site_name_font" value={fontKey} />

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">홈페이지 이름 글꼴</span>
        <select
          value={fontKey}
          onChange={(e) => onFontChange(parseSiteNameFontKey(e.target.value))}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500/30 focus:ring-2"
        >
          {SITE_NAME_FONT_OPTIONS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-zinc-500">
          로고가 없을 때 헤더·메인·푸터에 표시되는 이름에 적용됩니다.
        </span>
      </label>

      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-3">
        <p className="text-xs font-medium text-zinc-500">미리보기</p>
        <p
          className="mt-2 truncate text-xl font-semibold tracking-tight text-brand-900"
          style={{ fontFamily: option.fontFamily }}
        >
          {previewText.trim() || "홈페이지 이름"}
        </p>
      </div>
    </div>
  );
}
