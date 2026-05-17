import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Research Hub",
    template: "%s | Research Hub",
  },
  description:
    "기업·기관용 설문조사·리서치 플랫폼. 참여자용 메인 사이트와 관리자 도구를 분리했습니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
