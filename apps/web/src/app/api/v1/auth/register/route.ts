import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ detail: "Name, email, and password are required" }, { status: 400 });
    }

    // Check if user exists in live PostgreSQL
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing && existing.length > 0) {
      return NextResponse.json({ detail: "User with this email already exists" }, { status: 400 });
    }

    const userId = crypto.randomUUID();
    const settingsId = crypto.randomUUID();
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

    // Insert user into PostgreSQL
    await sql`
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES (${userId}, ${name}, ${email}, ${passwordHash}, NOW())
    `;

    // Insert settings into PostgreSQL
    await sql`
      INSERT INTO user_settings (id, user_id, theme, language, notifications)
      VALUES (${settingsId}, ${userId}, 'system', 'en', true)
    `;

    const user = {
      id: userId,
      name,
      email,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

    const tokenPayload = Buffer.from(JSON.stringify({ sub: userId, email, name })).toString("base64");
    const accessToken = `ss_live_${tokenPayload}.${crypto.randomBytes(16).toString("hex")}`;

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: crypto.randomBytes(32).toString("hex"),
      user,
    });
  } catch (err: any) {
    console.error("Live DB Register Error:", err);
    return NextResponse.json({ detail: err.message || "Failed to register account" }, { status: 500 });
  }
}
