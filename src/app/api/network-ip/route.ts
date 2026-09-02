import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const nets = os.networkInterfaces();
  let primaryIp = "localhost";
  const interfaces: Array<{ name: string; ip: string; isHotspot?: boolean; priority: number }> = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Find external IPv4 address
      if ((net.family === "IPv4" || (net as any).family === 4) && !net.internal) {
        const addr = net.address;
        
        // Strictly ignore link-local (169.254.x.x) and loopback addresses
        if (addr.startsWith("169.254.") || addr.startsWith("127.")) {
          continue;
        }

        const isLikelyHotspot = name.toLowerCase().includes("bridge") || addr.startsWith("172.20.");
        
        // Priority scoring: Hotspot (10) > 192.168.x.x (8) > 10.x.x.x (6) > 172.16-31.x.x (5) > others (1)
        let priority = 1;
        if (isLikelyHotspot) priority = 10;
        else if (addr.startsWith("192.168.")) priority = 8;
        else if (addr.startsWith("10.")) priority = 6;
        else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(addr)) priority = 5;

        interfaces.push({
          name: `${name} (${addr})`,
          ip: addr,
          isHotspot: isLikelyHotspot,
          priority
        });
      }
    }
  }

  // Sort by priority descending
  interfaces.sort((a, b) => b.priority - a.priority);

  if (interfaces.length > 0) {
    primaryIp = interfaces[0].ip;
  }

  return NextResponse.json({
    ip: primaryIp,
    interfaces: interfaces.map(({ name, ip, isHotspot }) => ({ name, ip, isHotspot })),
    hostname: os.hostname()
  });
}
