import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb", // 支持高清照片上传
    },
  },
};

export default nextConfig;
