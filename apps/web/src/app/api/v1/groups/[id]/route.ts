import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
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
        COUNT(m.id)::int as member_count
      FROM study_groups g
      LEFT JOIN chat_channels c ON c.group_id = g.id
      LEFT JOIN group_members m ON m.group_id = g.id
      WHERE g.id = ${id}
      GROUP BY g.id, g.owner_id, g.name, g.description, g.subject, g.visibility, g.created_at, c.nexconn_channel_id
    `;

    if (!groups || groups.length === 0) {
      return NextResponse.json({ detail: "Study group not found" }, { status: 404 });
    }

    const members = await sql`
      SELECT 
        m.id,
        m.group_id,
        m.user_id,
        m.role,
        m.joined_at,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar_url
      FROM group_members m
      JOIN users u ON u.id = m.user_id
      WHERE m.group_id = ${id}
      ORDER BY m.joined_at ASC
    `;

    const group = {
      ...groups[0],
      is_member: true,
      members: members.map((m: any) => ({
        id: m.id,
        group_id: m.group_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        user: {
          id: m.user_id,
          name: m.user_name,
          email: m.user_email,
          avatar_url: m.user_avatar_url,
        },
      })),
    };

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
