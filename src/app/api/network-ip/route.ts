import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const nets = os.networkInterfaces();
  let localIp = "localhost";

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Find external IPv4 address
      if ((net.family === "IPv4" || (net as any).family === 4) && !net.internal) {
        localIp = net.address;
        break;
      }
    }
    if (localIp !== "localhost") break;
  }

  return NextResponse.json({ ip: localIp });
}
