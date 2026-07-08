import { AdminSidebarWrapper } from "@/components/admin/AdminSidebarWrapper";
import { requireAdminPanelAccess } from "@/lib/require-admin";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPanelAccess();

  return (
    <div className="admin-shell">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <div className="hidden lg:block lg:shrink-0">
          <div className="sticky top-0 h-screen">
            <AdminSidebarWrapper />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-brand-900/8 bg-white/90 backdrop-blur-md lg:hidden">
            <AdminSidebarWrapper />
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
