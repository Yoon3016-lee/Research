import type { StaffRole } from "@/lib/roles";

export type SurveyParticipant =
  | { mode: "anonymous" }
  | {
      mode: "staff";
      userId: string;
      email: string;
      role: StaffRole;
      roleLabel: string;
    }
  | {
      mode: "guest_account";
      userId: string;
      email: string;
    };
