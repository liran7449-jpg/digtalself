import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "150mb", // 支持大视频上传
    },
  },
};

export default nextConfig;
