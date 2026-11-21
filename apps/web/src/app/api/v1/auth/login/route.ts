import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
    }

    // Query live PostgreSQL
    const users = await sql`
      SELECT id, name, email, avatar_url, created_at, password_hash 
      FROM users 
      WHERE email = ${email}
    `;

    if (!users || users.length === 0) {
      return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
    }

    const u = users[0];

    const user = {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar_url: u.avatar_url || null,
      created_at: u.created_at,
    };

    const tokenPayload = Buffer.from(JSON.stringify({ sub: u.id, email: u.email, name: u.name })).toString("base64");
    const accessToken = `ss_live_${tokenPayload}.${crypto.randomBytes(16).toString("hex")}`;

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: crypto.randomBytes(32).toString("hex"),
      user,
    });
  } catch (err: any) {
    console.error("Live DB Login Error:", err);
    return NextResponse.json({ detail: err.message || "Failed to log in" }, { status: 500 });
  }
}
