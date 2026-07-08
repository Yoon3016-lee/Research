"use client";

import { SignupKeyForm } from "@/components/admin/SignupKeyForm";
import { AdminSectionTabPanel } from "@/components/admin/AdminSectionTabPanel";
import { StaffRoleManager } from "@/components/admin/StaffRoleManager";
import type { ManageableProfileRow } from "@/lib/profiles-admin";

type Props = {
  actorRoleLabel: string;
  profiles: ManageableProfileRow[];
  isSuperAdmin: boolean;
};

export function PermissionsPanel({
  actorRoleLabel,
  profiles,
  isSuperAdmin,
}: Props) {
  const tabs = isSuperAdmin
    ? [
        { id: "staff", label: "직원 권한" },
        { id: "signup-key", label: "가입키 설정" },
      ]
    : [{ id: "staff", label: "직원 권한" }];

  return (
    <AdminSectionTabPanel tabs={tabs} defaultTabId="staff">
      {(activeId) => {
        if (activeId === "signup-key" && isSuperAdmin) {
          return (
            <section>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-brand-900">가입키 설정</h2>
                <p className="mt-1 text-sm text-brand-700/80">
                  새 가입키를 저장하면 이후 관리자 회원가입 시 새 키가 필요합니다. 서버·DB에만
                  저장됩니다.
                </p>
              </div>
              <div className="admin-card max-w-lg p-6">
                <SignupKeyForm />
              </div>
            </section>
          );
        }

        return (
          <section>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-brand-900">직원 권한</h2>
              <p className="mt-1 text-sm text-brand-700/80">
                가입된 직원·관리자 계정의 역할을 변경합니다. 본인보다 낮은 등급만 수정할 수
                있습니다.
              </p>
            </div>
            <StaffRoleManager actorRoleLabel={actorRoleLabel} profiles={profiles} />
          </section>
        );
      }}
    </AdminSectionTabPanel>
  );
}
