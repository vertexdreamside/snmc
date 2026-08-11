import { NextResponse } from "next/server";
import { loginSchema, identifyAndSignIn } from "@/lib/auth/identify";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  const result = await identifyAndSignIn(parsed.data);

  // Always 200, even on failure — the response body carries a deliberately
  // vague reason so this endpoint can't be used to enumerate valid
  // registration numbers.
  return NextResponse.json(result);
}
