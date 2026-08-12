export const PARTICIPATION_FORMATS = ["site", "email"] as const;
export type ParticipationFormat = (typeof PARTICIPATION_FORMATS)[number];

export const PARTICIPATION_FORMAT_LABELS: Record<ParticipationFormat, string> = {
  site: "사이트 형식",
  email: "이메일 형식",
};

export function parseParticipationFormat(value: unknown): ParticipationFormat {
  return value === "email" ? "email" : "site";
}

export function isEmailParticipation(format: ParticipationFormat): boolean {
  return format === "email";
}
