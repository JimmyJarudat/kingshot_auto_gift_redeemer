import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "got-global-avatar.akamaized.net",
        pathname: "/avatar/**",
      },
    ],
  },
};

export default nextConfig;
