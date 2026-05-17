import { AdminHeader } from "@/components/admin/AdminHeader";
import { StaffRoleManager } from "@/components/admin/StaffRoleManager";
import { getManageableProfiles } from "@/lib/profiles-admin";
import { requireAdminPanelAccess } from "@/lib/require-admin";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";

export const metadata = { title: "직원 권한 관리" };

export default async function AdminStaffRolesPage() {
  const actor = await requireAdminPanelAccess();
  const manageableProfiles = await getManageableProfiles(actor.userId, actor.role);
  const actorRoleLabel =
    actor.role in ROLE_LABELS ? ROLE_LABELS[actor.role as StaffRole] : actor.role;

  return (
    <>
      <AdminHeader
        title="직원 권한 관리"
        description="가입된 직원·관리자 계정의 역할을 변경합니다. 본인보다 낮은 등급만 수정할 수 있습니다."
      />
      <div className="p-4 sm:p-6">
        <StaffRoleManager
          actorRoleLabel={actorRoleLabel}
          profiles={manageableProfiles}
        />
      </div>
    </>
  );
}
