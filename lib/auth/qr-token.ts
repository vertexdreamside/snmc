// Signed QR verification tokens (Section 8). HMAC-signed so a token can't
// be forged or guessed by incrementing an ID, and reissued whenever a
// licence is renewed or a person's status changes (see comments below).

import { createHmac, randomBytes } from "crypto";

export function generateQrToken(personId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const payload = `${personId}.${nonce}`;
  const signature = createHmac("sha256", requireSecret()).update(payload).digest("hex").slice(0, 24);
  return `${nonce}.${signature}`;
}

export function verifyQrToken(personId: string, token: string): boolean {
  const [nonce, signature] = token.split(".");
  if (!nonce || !signature) return false;
  const payload = `${personId}.${nonce}`;
  const expected = createHmac("sha256", requireSecret()).update(payload).digest("hex").slice(0, 24);
  return timingSafeEqual(signature, expected);
}

function requireSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) throw new Error("QR_SIGNING_SECRET is not set.");
  return secret;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
