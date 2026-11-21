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

export async function GET(req: Request) {
  const auth = parseAuth(req);
  const currentUserId = auth?.sub || "";

  try {
    // Query study groups along with member count and membership from PostgreSQL
    const groups = await sql`
      SELECT 
        g.id,
        g.owner_id,
        g.name,
        g.description,
        g.subject,
        g.visibility,
        g.created_at,
        c.nexconn_channel_id,
        COUNT(m.id)::int as member_count,
        BOOL_OR(m.user_id = ${currentUserId}) as is_member,
        MAX(CASE WHEN m.user_id = ${currentUserId} THEN m.role ELSE NULL END) as user_role
      FROM study_groups g
      LEFT JOIN chat_channels c ON c.group_id = g.id
      LEFT JOIN group_members m ON m.group_id = g.id
      GROUP BY g.id, g.owner_id, g.name, g.description, g.subject, g.visibility, g.created_at, c.nexconn_channel_id
      ORDER BY g.created_at DESC
    `;

    return NextResponse.json(groups);
  } catch (err: any) {
    console.error("Live DB Groups Error:", err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = parseAuth(req);
  const currentUserId = auth?.sub || "d1d7e7a7-67f6-4d80-bde1-52991cf90244"; // Alice Johnson default if not tokenized

  try {
    const { name, description, subject, visibility } = await req.json();
    if (!name) {
      return NextResponse.json({ detail: "Group name is required" }, { status: 400 });
    }

    const groupId = crypto.randomUUID();
    const memberId = crypto.randomUUID();
    const channelId = crypto.randomUUID();
    const nexconnChannelId = `grp-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${crypto.randomBytes(3).toString("hex")}`;

    await sql`
      INSERT INTO study_groups (id, owner_id, name, description, subject, visibility, created_at)
      VALUES (${groupId}, ${currentUserId}, ${name}, ${description || ""}, ${subject || "General"}, ${visibility || "public"}, NOW())
    `;

    await sql`
      INSERT INTO group_members (id, group_id, user_id, role, joined_at)
      VALUES (${memberId}, ${groupId}, ${currentUserId}, 'owner', NOW())
    `;

    await sql`
      INSERT INTO chat_channels (id, group_id, nexconn_channel_id, created_at)
      VALUES (${channelId}, ${groupId}, ${nexconnChannelId}, NOW())
    `;

    const newGroup = {
      id: groupId,
      owner_id: currentUserId,
      name,
      description: description || "",
      subject: subject || "General",
      visibility: visibility || "public",
      created_at: new Date().toISOString(),
      member_count: 1,
      is_member: true,
      user_role: "owner",
      nexconn_channel_id: nexconnChannelId,
    };

    return NextResponse.json(newGroup);
  } catch (err: any) {
    console.error("Live DB Create Group Error:", err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
