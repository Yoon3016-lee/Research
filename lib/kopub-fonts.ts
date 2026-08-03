import localFont from "next/font/local";

/** KoPub 돋움체 — CSS 변수 --font-kopub-dotum */
export const kopubDotum = localFont({
  src: [
    {
      path: "../node_modules/font-kopub/fonts/KoPubDotum-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubDotum-Medium.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubDotum-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubDotum-Bold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubDotum-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-kopub-dotum",
  display: "swap",
  fallback: ["Malgun Gothic", "Apple SD Gothic Neo", "sans-serif"],
});

/** KoPub 바탕체 — CSS 변수 --font-kopub-batang */
export const kopubBatang = localFont({
  src: [
    {
      path: "../node_modules/font-kopub/fonts/KoPubBatang-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubBatang-Medium.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubBatang-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubBatang-Bold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/font-kopub/fonts/KoPubBatang-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-kopub-batang",
  display: "swap",
  fallback: ["Batang", "Apple Myungjo", "serif"],
});
