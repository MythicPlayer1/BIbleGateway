import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const nets = os.networkInterfaces();
  let primaryIp = "localhost";
  const interfaces: Array<{ name: string; ip: string; isHotspot?: boolean }> = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Find external IPv4 address
      if ((net.family === "IPv4" || (net as any).family === 4) && !net.internal) {
        const isLikelyHotspot = name.toLowerCase().includes("bridge") || net.address.startsWith("172.20.");
        interfaces.push({
          name: `${name} (${net.address})`,
          ip: net.address,
          isHotspot: isLikelyHotspot
        });
        if (primaryIp === "localhost") {
          primaryIp = net.address;
        }
      }
    }
  }

  return NextResponse.json({
    ip: primaryIp,
    interfaces,
    hostname: os.hostname()
  });
}
