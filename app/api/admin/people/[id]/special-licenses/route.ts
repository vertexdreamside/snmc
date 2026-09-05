import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createServiceRoleClient } from "@/lib/supabase/server";

const createSchema = z.object({
  licenseName: z.string().min(1, "Licence name is required"),
  licenseNumber: z.string().optional(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(["register"]);
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: parsed.error.errors[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("special_licenses").insert({
    person_id: params.id,
    license_name: parsed.data.licenseName,
    license_number: parsed.data.licenseNumber || null,
    issued_date: parsed.data.issuedDate || null,
    expiry_date: parsed.data.expiryDate || null,
    created_by: admin.id,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: "Could not add the special licence." }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "admin_added_special_license",
    target_table: "people",
    target_id: params.id,
    details: { license_name: parsed.data.licenseName },
  });

  return NextResponse.json({ ok: true });
}
