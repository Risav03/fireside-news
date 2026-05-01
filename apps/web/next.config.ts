import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/core", "@repo/db", "@repo/queue", "@repo/utils"],
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };

    return config;
  },
};

export default nextConfig;
