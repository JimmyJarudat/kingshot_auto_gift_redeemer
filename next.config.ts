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
        pathname: "/avatar-dev/**",
      },
      {
        protocol: "https",
        hostname: "got-global-avatar.akamaized.net",
        pathname: "/img/icon/**",
      },
      {
        protocol: "https",
        hostname: "ks-giftcode.centurygame.com",
        pathname: "/img/**",
      },
    ],
  },
};

export default nextConfig;
