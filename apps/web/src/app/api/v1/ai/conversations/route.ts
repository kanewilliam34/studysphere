import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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

export async function GET(req: Request) {
  const auth = parseAuth(req);
  const currentUserId = auth?.sub || "d1d7e7a7-67f6-4d80-bde1-52991cf90244";

  try {
    const conversations = await sql`
      SELECT id, user_id, title, created_at 
      FROM ai_conversations 
      WHERE user_id = ${currentUserId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(conversations);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
