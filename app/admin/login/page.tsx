"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F3D2E] flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-16 h-16 mb-3">
            <Image
              src="https://sibert.sc/wp-content/uploads/2020/11/cropped-Sibert-logo-scaled-1-270x270.png"
              alt="Sibert Residence"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <h1 className="text-lg font-semibold text-[#16241C]">Sibert Residence Admin</h1>
          <p className="text-sm text-[#3C4A41] mt-1">Sign in to edit the website</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8577]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#C9C2B4] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857]"
                placeholder="you@sibert.sc"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8577]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#C9C2B4] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857]"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F3D2E] text-white font-medium py-2.5 rounded-lg text-sm hover:bg-[#1D5C41] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-[#8C8577] mt-6 text-center">
          No account yet? Ask your developer to create one from the Supabase dashboard.
        </p>
      </div>
    </div>
  );
}
