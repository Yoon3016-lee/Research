"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileRoleAction } from "@/app/actions/update-profile-role";
import type { ManageableProfileRow } from "@/lib/profiles-admin";
import type { StaffRole } from "@/lib/roles";

type Props = {
  actorRoleLabel: string;
  profiles: ManageableProfileRow[];
};

export function StaffRoleManager({ actorRoleLabel, profiles }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSave = (profileId: string, newRole: StaffRole) => {
    setMessage(null);
    setPendingId(profileId);
    startTransition(async () => {
      const res = await updateProfileRoleAction(profileId, newRole);
      setPendingId(null);
      if (res.error) {
        setMessage({ type: "err", text: res.error });
        return;
      }
      setMessage({ type: "ok", text: "역할이 변경되었습니다." });
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-zinc-600">
        현재 권한: <strong className="font-medium text-zinc-800">{actorRoleLabel}</strong>
        . 본인보다 낮은 등급의 계정만, 본인과 같거나 낮은 역할로 변경할 수 있습니다.
      </p>

      {message ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {message.text}
        </p>
      ) : null}

      {profiles.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-600">
          변경할 수 있는 하위 등급 사용자가 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80">
              <tr>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">이메일</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">현재 역할</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">변경</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">저장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {profiles.map((p) => (
                <ProfileRoleRow
                  key={`${p.id}-${p.role}`}
                  profile={p}
                  saving={pending && pendingId === p.id}
                  onSave={handleSave}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProfileRoleRow({
  profile,
  saving,
  onSave,
}: {
  profile: ManageableProfileRow;
  saving: boolean;
  onSave: (id: string, role: StaffRole) => void;
}) {
  const [selected, setSelected] = useState<StaffRole>(profile.role);

  return (
    <tr className="hover:bg-zinc-50/80">
      <td className="px-3 py-3 text-zinc-800">{profile.email}</td>
      <td className="px-3 py-3 text-zinc-600">{profile.roleLabel}</td>
      <td className="px-3 py-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as StaffRole)}
          disabled={saving}
          className="w-full min-w-[8.5rem] rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          aria-label={`${profile.email} 역할 변경`}
        >
          {profile.assignableRoles.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          disabled={saving || selected === profile.role}
          onClick={() => onSave(profile.id, selected)}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "적용"}
        </button>
      </td>
    </tr>
  );
}
