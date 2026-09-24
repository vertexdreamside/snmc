// Section 7: "Device type, browser, operating system" — parsed from the
// standard User-Agent header, which every request already carries; no
// separate collection or client-side script needed, and nothing beyond
// what's already in a header every browser sends anyway ("Do not
// collect unnecessary personal/device information"). Deliberately a
// simple, readable summary rather than a full UA-parsing library — good
// enough to answer "what kind of device was this," not fingerprinting.
export function getDeviceInfo(request: Request): { browser: string; os: string; deviceType: string; raw: string | null } {
  const ua = request.headers.get("user-agent");
  if (!ua) return { browser: "Unknown", os: "Unknown", deviceType: "Unknown", raw: null };

  let browser = "Unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  const deviceType = /Mobile|Android|iPhone/.test(ua) ? "Mobile" : /iPad|Tablet/.test(ua) ? "Tablet" : "Desktop";

  return { browser, os, deviceType, raw: ua };
}
