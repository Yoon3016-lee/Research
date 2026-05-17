import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | 관리자",
    default: "관리자",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
