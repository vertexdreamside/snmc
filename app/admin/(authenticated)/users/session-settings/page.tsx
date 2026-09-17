import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { SessionSettingsForm } from "./SessionSettingsForm";

export default async function SessionSettingsPage() {
  await requireAdmin(["users"]);
  const supabase = createClient();
  const { data } = await supabase.from("session_settings").select("warning_seconds_before_expiry").limit(1).maybeSingle();

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="font-display text-xl text-council-navy">Session Warning Settings</h1>
        <p className="font-body text-sm text-council-ink/60 mt-1">
          Controls how much advance warning someone gets before their session expires. This does not change how
          long a session actually lasts — that's a Supabase project setting (Auth → Sessions → JWT expiry),
          configured separately in the Supabase dashboard, not here.
        </p>
      </div>
      <SessionSettingsForm initialSeconds={data?.warning_seconds_before_expiry ?? 120} />
    </div>
  );
}
