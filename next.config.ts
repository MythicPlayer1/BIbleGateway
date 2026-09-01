import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices on local Wi-Fi & iPhone Hotspot (172.20.x.x, 192.168.x.x, 10.x.x.x)
  // Without this, Next.js 15/16 dev server returns 403 Forbidden for /_next/static/ chunks.
  allowedDevOrigins: [
    "172.20.10.2",
    "172.20.10.2:3000",
    "172.20.*.*",
    "172.20.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
    "172.*.*.*",
    "172.*",
    "192.168.1.*",
    "192.168.0.*",
    "192.168.*.*",
    "192.168.*",
    "10.*.*.*",
    "10.*",
    "*.local",
    "*.local:3000",
    "localhost:3000",
    "localhost",
  ],
};

export default nextConfig;
