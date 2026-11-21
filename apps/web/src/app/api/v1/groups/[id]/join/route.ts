import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = parseAuth(req);
  const currentUserId = auth?.sub || "d1d7e7a7-67f6-4d80-bde1-52991cf90244";

  try {
    const existing = await sql`SELECT id FROM group_members WHERE group_id = ${id} AND user_id = ${currentUserId}`;
    if (!existing || existing.length === 0) {
      await sql`
        INSERT INTO group_members (id, group_id, user_id, role, joined_at)
        VALUES (${crypto.randomUUID()}, ${id}, ${currentUserId}, 'member', NOW())
      `;
    }

    const groups = await sql`
      SELECT 
        g.id, g.owner_id, g.name, g.description, g.subject, g.visibility, g.created_at, c.nexconn_channel_id,
        COUNT(m.id)::int as member_count
      FROM study_groups g
      LEFT JOIN chat_channels c ON c.group_id = g.id
      LEFT JOIN group_members m ON m.group_id = g.id
      WHERE g.id = ${id}
      GROUP BY g.id, g.owner_id, g.name, g.description, g.subject, g.visibility, g.created_at, c.nexconn_channel_id
    `;

    return NextResponse.json({ ...groups[0], is_member: true, user_role: "member" });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
