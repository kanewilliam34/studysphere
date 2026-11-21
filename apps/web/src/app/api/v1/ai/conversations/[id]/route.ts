import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const convs = await sql`
      SELECT id, user_id, title, created_at 
      FROM ai_conversations 
      WHERE id = ${id}
    `;

    if (!convs || convs.length === 0) {
      return NextResponse.json({ detail: "Conversation not found" }, { status: 404 });
    }

    const messages = await sql`
      SELECT id, conversation_id, role, content, created_at 
      FROM ai_messages 
      WHERE conversation_id = ${id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      ...convs[0],
      messages,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
