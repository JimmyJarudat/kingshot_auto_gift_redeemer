import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "got-global-avatar.akamaized.net",
        pathname: "/avatar/**",
      },
      {
        protocol: "https",
        hostname: "got-global-avatar.akamaized.net",
        pathname: "/img/icon/**",
      },
    ],
  },
};

export default nextConfig;
