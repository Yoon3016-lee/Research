/** 관리자·공개 진행률 막대 — 가로 그라데이션(왼쪽 어두움 → 오른쪽 밝음) */

export type ProgressBarTone = "active" | "completed";

/** 설문 상태 → 막대 색 톤 (종료=완료 파란 계열, 그 외=진행 주황·노랑) */
export function progressToneFromStatus(status: string | null | undefined): ProgressBarTone {
  return status === "종료" ? "completed" : "active";
}

const GRADIENTS: Record<ProgressBarTone, string> = {
  // 진행중: 주황 → 노랑
  active:
    "linear-gradient(90deg, #c2410c 0%, #ea580c 32%, #f59e0b 68%, #fde047 100%)",
  // 완료(종료): 파랑 → 하늘색
  completed:
    "linear-gradient(90deg, #1e40af 0%, #2563eb 32%, #0ea5e9 68%, #7dd3fc 100%)",
};

/**
 * 0~100% 전체 구간에 가로 그라데이션을 두고,
 * 채워진 너비만큼만 보이도록 background-size를 맞춤.
 */
export function progressFillStyle(
  percent: number,
  tone: ProgressBarTone = "active",
): {
  width: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat: "no-repeat";
  backgroundPosition: string;
} {
  const pct = Math.min(100, Math.max(0, percent));
  const sizeX = pct > 0 ? `${(100 / pct) * 100}%` : "100%";
  return {
    width: `${pct}%`,
    backgroundImage: GRADIENTS[tone],
    backgroundSize: `${sizeX} 100%`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "left center",
  };
}

/** @deprecated progressFillStyle 사용 */
export function progressFillGradient(
  percent: number,
  tone: ProgressBarTone = "active",
): string {
  return progressFillStyle(percent, tone).backgroundImage;
}

/** 빈도 막대: 직원(파랑) · 게스트(호박) — 가로/세로 그라데이션 */
export const FREQ_STAFF_H_CLASS =
  "h-full bg-gradient-to-r from-blue-800 to-sky-400";
export const FREQ_GUEST_H_CLASS =
  "h-full bg-gradient-to-r from-amber-700 to-amber-300";
export const FREQ_STAFF_V_CLASS =
  "w-full bg-gradient-to-t from-blue-800 to-sky-400";
export const FREQ_GUEST_V_CLASS =
  "w-full bg-gradient-to-t from-amber-700 to-amber-300";

/** 값이 클수록 진하게 (0.55~1) */
export function progressBarIntensity(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0.55;
  return Math.min(1, 0.55 + 0.45 * (value / max));
}

type ProgressGradientBarProps = {
  percent: number;
  label?: string;
  className?: string;
  /** 트랙 배경 */
  trackClassName?: string;
  /**
   * active = 진행중 (주황→노랑)
   * completed = 완료/종료 (파랑→하늘)
   */
  tone?: ProgressBarTone;
};

export function ProgressGradientBar({
  percent,
  label,
  className = "",
  trackClassName = "bg-brand-900/8",
  tone = "active",
}: ProgressGradientBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full ${trackClassName} ${className}`.trim()}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `진행률 ${pct}%`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={progressFillStyle(pct, tone)}
      />
    </div>
  );
}
