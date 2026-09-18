"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Bold, Italic, RemoveFormatting } from "lucide-react";
import {
  SURVEY_PROMPT_COLORS,
  SURVEY_PROMPT_FONT_FAMILIES,
  SURVEY_PROMPT_FONT_SIZES,
  sanitizeSurveyPromptHtml,
} from "@/lib/survey-prompt-html";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function toEditorHtml(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  return sanitizeSurveyPromptHtml(trimmed);
}

export function PromptRichTextEditor({
  value,
  onChange,
  placeholder = "응답자에게 보여질 질문을 입력하세요.",
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        strike: false,
      }),
      TextStyleKit.configure({
        backgroundColor: false,
        lineHeight: false,
      }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        class:
          "min-h-[5.5rem] px-3 py-2.5 text-sm leading-relaxed text-zinc-900 outline-none [&_p]:m-0 [&_p+p]:mt-2",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? "" : sanitizeSurveyPromptHtml(ed.getHTML());
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = toEditorHtml(value);
    const current = editor.isEmpty ? "" : sanitizeSurveyPromptHtml(editor.getHTML());
    if (next !== current) {
      editor.commands.setContent(next || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="mt-1.5 min-h-[7rem] rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm text-zinc-400">
        편집기 로딩…
      </div>
    );
  }

  const currentColor =
    (editor.getAttributes("textStyle").color as string | undefined) || "";
  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) || "";
  const currentFamily =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) || "";

  return (
    <div className="mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/30 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-white/80 px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded-md p-1.5 ${
            editor.isActive("bold")
              ? "bg-indigo-100 text-indigo-900"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
          title="굵게"
          aria-label="굵게"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded-md p-1.5 ${
            editor.isActive("italic")
              ? "bg-indigo-100 text-indigo-900"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
          title="기울임"
          aria-label="기울임"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <span className="mx-1 h-4 w-px bg-zinc-200" aria-hidden />

        <label className="flex items-center gap-1 text-[11px] text-zinc-500">
          크기
          <select
            value={currentSize}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetFontSize().run();
              else editor.chain().focus().setFontSize(v).run();
            }}
            className="rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-800"
          >
            <option value="">기본</option>
            {SURVEY_PROMPT_FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1 text-[11px] text-zinc-500">
          글씨체
          <select
            value={currentFamily}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetFontFamily().run();
              else editor.chain().focus().setFontFamily(v).run();
            }}
            className="max-w-[9rem] rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-800"
          >
            {SURVEY_PROMPT_FONT_FAMILIES.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1 text-[11px] text-zinc-500">
          색
          <select
            value={currentColor}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetColor().run();
              else editor.chain().focus().setColor(v).run();
            }}
            className="rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-800"
          >
            <option value="">기본</option>
            {SURVEY_PROMPT_COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          className="ml-auto rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          title="서식 지우기"
          aria-label="서식 지우기"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
