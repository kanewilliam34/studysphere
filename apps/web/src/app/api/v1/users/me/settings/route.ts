import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    id: "settings-prod",
    user_id: "live-user",
    theme: "system",
    language: "en",
    notifications: true,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  return NextResponse.json({
    id: "settings-prod",
    user_id: "live-user",
    theme: body.theme || "system",
    language: body.language || "en",
    notifications: body.notifications !== undefined ? body.notifications : true,
  });
}
