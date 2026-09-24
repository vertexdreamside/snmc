// Extracts the real client IP from request headers — never trusts a
// client-reported value (a browser can't be relied on to honestly report
// its own address, and shouldn't be asked to). Vercel populates
// x-forwarded-for with the actual connecting IP as the first entry in a
// comma-separated list; x-real-ip is the fallback for other proxy setups.
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}
