import { NextResponse } from "next/server";
import { loginSchema, identifyAndSignIn } from "@/lib/auth/identify";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Invalid input." }, { status: 400 });
  }

  // Derive the real origin from the incoming request rather than an env
  // var, so this works correctly across the vercel.app URL, any preview
  // deployment, and the custom domain without needing separate config for
  // each — the magic link's redirectTo must point back at whichever
  // origin the person is actually using.
  const siteOrigin = new URL(request.url).origin;

  const result = await identifyAndSignIn(parsed.data, siteOrigin);

  // Always 200, even on failure — the response body carries a deliberately
  // vague reason so this endpoint can't be used to enumerate valid
  // registration numbers.
  return NextResponse.json(result);
}
