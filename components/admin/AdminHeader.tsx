import { Bell } from "lucide-react";

type AdminHeaderProps = {
  title: string;
  description?: string;
};

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-brand-900/8 bg-white/85 px-4 py-5 backdrop-blur-md sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-brand-900 sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-brand-700">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-900/10 bg-white text-brand-700 shadow-sm transition hover:border-accent-500/30 hover:bg-accent-500/5"
          aria-label="알림"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
