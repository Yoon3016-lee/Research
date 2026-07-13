"use client";

import { useEffect } from "react";

/**
 * 배너 폭을 "접속 화면 해상도(px 고정값)"로 지정하기 위한 CSS 변수 주입기.
 *
 * screen.width 는 브라우저 확대/축소와 무관하게 고정이므로, 이 값을 px 로 쓰면
 * - 확대율 100%(전체화면): 뷰포트 폭 ≈ 해상도 → 배너가 화면을 꽉 채움
 * - 축소: px 값이 물리적으로 작아짐 → 배너도 함께 작아짐
 * - 확대: px 값이 물리적으로 커짐 → 배너도 함께 커짐
 */
export function BannerWidthVar() {
  useEffect(() => {
    const apply = () => {
      const w = window.screen?.width;
      if (w && Number.isFinite(w)) {
        document.documentElement.style.setProperty(
          "--site-banner-resolution",
          `${Math.round(w)}px`,
        );
      }
    };
    apply();
    // 다른 해상도 모니터로 창을 옮기는 경우 등에 대비해 갱신
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return null;
}
