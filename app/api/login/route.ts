import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, pin } = await req.json();

  const validUsername = process.env.AUTH_USERNAME;
  const validPin = process.env.AUTH_PIN;

  if (username === validUsername && pin === validPin) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("horologie-auth", "true", { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
