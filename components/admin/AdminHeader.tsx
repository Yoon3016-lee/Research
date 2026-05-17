import { Bell } from "lucide-react";

type AdminHeaderProps = {
  title: string;
  description?: string;
};

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 bg-white px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
          aria-label="알림"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
