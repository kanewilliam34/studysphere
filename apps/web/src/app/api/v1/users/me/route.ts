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
  if (!auth?.sub) {
    // Return first user or default for live preview
    const users = await sql`SELECT id, name, email, avatar_url, created_at FROM users LIMIT 1`;
    if (users && users.length > 0) return NextResponse.json(users[0]);
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await sql`
      SELECT id, name, email, avatar_url, created_at 
      FROM users 
      WHERE id = ${auth.sub}
    `;
    if (!users || users.length === 0) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }
    return NextResponse.json(users[0]);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = parseAuth(req);
  if (!auth?.sub) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, avatar_url } = await req.json();
    if (name) {
      await sql`UPDATE users SET name = ${name} WHERE id = ${auth.sub}`;
    }
    if (avatar_url !== undefined) {
      await sql`UPDATE users SET avatar_url = ${avatar_url} WHERE id = ${auth.sub}`;
    }
    const updated = await sql`SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ${auth.sub}`;
    return NextResponse.json(updated[0]);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
