// TEMPORARY diagnostic route — not part of the app's real feature set.
// Purpose: the register/[id] page's special_licenses query returns an
// empty array in production for a row that is confirmed to exist and be
// correctly RLS-visible when tested directly in SQL, and the app's
// `const { data } = await supabase...` pattern never checks `.error`, so
// any real failure is silently swallowed into `[]`. This route runs the
// exact same query, on the exact same request-scoped regular client, and
// returns BOTH data and error/status so the actual failure (if any) is
// visible instead of hidden. Delete this route once the mystery is
// resolved — it is not meant to stay in the codebase.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const personId = searchParams.get("personId");
  if (!personId) return NextResponse.json({ ok: false, reason: "personId required" }, { status: 400 });

  const supabase = await createClient();

  const result = await supabase
    .from("special_licenses")
    .select("id, license_name, license_number, issued_date, expiry_date, status, source, document_path")
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  // Also run it with zero filters/order, and a raw count, to see whether
  // the eq()/order() themselves are implicated or whether even the
  // simplest possible query on this table fails for this client.
  const rawAll = await supabase.from("special_licenses").select("id, person_id, license_name, status");
  const countOnly = await supabase.from("special_licenses").select("*", { count: "exact", head: true });

  return NextResponse.json({
    ok: true,
    filtered: { data: result.data, error: result.error, status: result.status, statusText: result.statusText },
    rawAll: { data: rawAll.data, error: rawAll.error, status: rawAll.status },
    countOnly: { count: countOnly.count, error: countOnly.error, status: countOnly.status },
  });
}
