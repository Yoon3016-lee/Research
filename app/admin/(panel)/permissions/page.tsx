import { AdminHeader } from "@/components/admin/AdminHeader";
import { PermissionsPanel } from "@/components/admin/PermissionsPanel";
import { getManageableProfiles } from "@/lib/profiles-admin";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";

export const metadata = { title: "권한 관리" };

export const dynamic = "force-dynamic";

export default async function AdminPermissionsPage() {
  const actor = await requireAdminPanelAccess();
  const isSuperAdmin = actor.role === "super_admin";
  const manageableProfiles = await getManageableProfiles(actor.userId, actor.role);
  const actorRoleLabel =
    actor.role in ROLE_LABELS ? ROLE_LABELS[actor.role as StaffRole] : actor.role;

  return (
    <>
      <AdminHeader
        title="권한 관리"
        description="직원 역할과 관리자 가입키를 관리합니다."
      />
      <div className="p-4 sm:p-6">
        <PermissionsPanel
          actorRoleLabel={actorRoleLabel}
          profiles={manageableProfiles}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </>
  );
}
