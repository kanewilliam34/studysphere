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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = parseAuth(req);
  const currentUserId = auth?.sub || "d1d7e7a7-67f6-4d80-bde1-52991cf90244";

  try {
    await sql`DELETE FROM group_members WHERE group_id = ${id} AND user_id = ${currentUserId}`;
    return NextResponse.json({ message: "Left group successfully" });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
