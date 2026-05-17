"use client";

export function PopupCloseButton({ label = "창 닫기" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.close()}
      className="mt-6 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
    >
      {label}
    </button>
  );
}
