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

export async function GET() {
  try {
    const notes = await sql`
      SELECT 
        n.id,
        n.owner_id,
        n.title,
        n.description,
        n.file_key,
        n.mime_type,
        n.file_size,
        n.created_at,
        u.name as owner_name
      FROM notes n
      LEFT JOIN users u ON u.id = n.owner_id
      ORDER BY n.created_at DESC
    `;
    return NextResponse.json(notes);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = parseAuth(req);
  const currentUserId = auth?.sub || "d1d7e7a7-67f6-4d80-bde1-52991cf90244";
  const currentUserName = auth?.name || "Alice Johnson";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || file?.name || "Uploaded Note.pdf";
    const description = (formData.get("description") as string) || "";

    const noteId = crypto.randomUUID();
    const fileKey = `notes/${crypto.randomUUID()}.pdf`;
    const fileSize = file?.size || 1540000;
    const mimeType = file?.type || "application/pdf";

    await sql`
      INSERT INTO notes (id, owner_id, title, description, file_key, mime_type, file_size, created_at)
      VALUES (${noteId}, ${currentUserId}, ${title}, ${description}, ${fileKey}, ${mimeType}, ${fileSize}, NOW())
    `;

    const newNote = {
      id: noteId,
      owner_id: currentUserId,
      title,
      description,
      file_key: fileKey,
      mime_type: mimeType,
      file_size: fileSize,
      created_at: new Date().toISOString(),
      owner_name: currentUserName,
    };

    return NextResponse.json(newNote);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
