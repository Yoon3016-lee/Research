import "server-only";

/** 후이즈 10분 500통 제한보다 여유 있게 — 배치당 최대 발송 수 */
export const EMAIL_SEND_BATCH_SIZE = 400;

/** 안전 전송 간격 (1초당 1건) */
export const EMAIL_SEND_INTERVAL_MS = 1000;

/**
 * 배치 후 쿨다운.
 * TODO(prod): 후이즈 한도(약 10분)에 맞게 `10 * 60 * 1000`으로 되돌릴 것.
 * 현재는 테스트용 10초.
 */
export const EMAIL_SEND_COOLDOWN_MS = 10 * 1000;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatCooldownWait(ms: number): string {
  if (ms < 60_000) {
    const seconds = Math.max(1, Math.ceil(ms / 1000));
    return `${seconds}초`;
  }
  const minutes = Math.ceil(ms / 60_000);
  return `${minutes}분`;
}

/** UI·메시지용 쿨다운 문구 (예: "10초", "10분") */
export function formatCooldownLabel(ms: number = EMAIL_SEND_COOLDOWN_MS): string {
  return formatCooldownWait(ms);
}
