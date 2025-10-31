import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json();

    // Get the public IP via external API
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipRes.json();

    console.log("Detected IP:", ip, "Device ID:", deviceId);

    const allowedIPs = process.env.ALLOWED_IP_ADDRESSES?.split(",") || [];
    const allowedDevices = process.env.ALLOWED_DEVICES?.split(",") || [];

    const authorized =
      allowedIPs.includes(ip) && allowedDevices.includes(deviceId);

    return NextResponse.json({ authorized });
  } catch (err) {
    console.error("Error verifying access:", err);
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
}
