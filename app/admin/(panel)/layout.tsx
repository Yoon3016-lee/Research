import { AdminSidebarWrapper } from "@/components/admin/AdminSidebarWrapper";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPanelAccess();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <div className="hidden lg:block lg:shrink-0">
          <div className="sticky top-0 h-screen">
            <AdminSidebarWrapper />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-zinc-200 bg-white lg:hidden">
            <AdminSidebarWrapper />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
