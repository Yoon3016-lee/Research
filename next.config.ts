import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 로고·배너 등 파일 업로드 (site-media-upload 최대 10MB와 맞춤)
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
