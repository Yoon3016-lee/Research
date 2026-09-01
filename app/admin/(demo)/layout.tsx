import Link from "next/link";

export default function AdminDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-brand-50/40">
      <div className="border-b border-brand-900/8 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <Link href="/" className="text-sm text-brand-700 transition hover:text-brand-900">
            ← 홈
          </Link>
          <Link
            href="/admin/surveys"
            className="text-sm text-brand-700 transition hover:text-brand-900"
          >
            설문 관리
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </div>
  );
}
