import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices on local Wi-Fi (192.168.x.x) to load static JS/CSS chunks.
  // Without this, Next.js 15+ returns 403 Forbidden for /_next/static/ from non-localhost origins.
  allowedDevOrigins: [
    "192.168.1.*",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
  ],
};

export default nextConfig;
