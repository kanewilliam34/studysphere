import { NextResponse } from "next/server";
import crypto from "crypto";

function parseAuth(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    if (token.startsWith("ss_live_")) {
      const b64 = token.split(".")[0].replace("ss_live_", "");
      return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
    }
  } catch {}
  return null;
}

export async function POST(req: Request) {
  const auth = parseAuth(req);
  const userId = auth?.sub || "d1d7e7a7-67f6-4d80-bde1-52991cf90244";
  const appKey = process.env.NEXT_PUBLIC_NEXCONN_APP_KEY || "studysphere_app_key_placeholder";

  const tokenData = {
    app_key: appKey,
    user_id: userId,
    access_token: `nc_live_${crypto.randomBytes(24).toString("hex")}`,
    base_url: "https://api.sg-light-api.com",
    is_simulated: true,
  };

  return NextResponse.json(tokenData);
}
