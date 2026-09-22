"use client";

import { useState } from "react";
import Image from "next/image";
import { Save, Check } from "lucide-react";
import { saveContent } from "@/app/admin/actions";
import type { SiteInfo } from "@/lib/content";

export default function SiteEditor({ initial }: { initial: SiteInfo }) {
  const [site, setSite] = useState<SiteInfo>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SiteInfo>(key: K, value: SiteInfo[K]) {
    setSite((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveContent("site", site);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#16241C] mb-1">Site Info</h1>
      <p className="text-sm text-[#3C4A41] mb-6">Contact details, social links and logos shown across the site.</p>

      <div className="bg-white rounded-xl border border-[#EDE3CE] p-5 sm:p-6 space-y-5">
        <TextField label="Property Name" value={site.name} onChange={(v) => set("name", v)} />
        <TextField label="Tagline (short, under name in header)" value={site.tagline} onChange={(v) => set("tagline", v)} />
        <div className="grid sm:grid-cols-2 gap-5">
          <TextField
            label="Loader Eyebrow"
            value={site.sloganEyebrow}
            onChange={(v) => set("sloganEyebrow", v)}
            placeholder="Welcome to Paradise"
          />
          <TextField
            label="Slogan (loader + footer)"
            value={site.slogan}
            onChange={(v) => set("slogan", v)}
            placeholder="Your Serene Hideaway in La Digue"
          />
        </div>
        <TextField label="Address" value={site.address} onChange={(v) => set("address", v)} />

        <div className="grid sm:grid-cols-2 gap-5">
          <TextField label="Phone (display)" value={site.phone} onChange={(v) => set("phone", v)} />
          <TextField
            label="Phone (tel: link)"
            value={site.phoneHref}
            onChange={(v) => set("phoneHref", v)}
            placeholder="tel:+2481234567"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <TextField label="WhatsApp (display)" value={site.whatsapp} onChange={(v) => set("whatsapp", v)} />
          <TextField
            label="WhatsApp Link (wa.me)"
            value={site.whatsappHref}
            onChange={(v) => set("whatsappHref", v)}
            placeholder="https://wa.me/2481234567?text=..."
          />
        </div>

        <TextField label="Email" value={site.email} onChange={(v) => set("email", v)} type="email" />

        <div className="grid sm:grid-cols-2 gap-5">
          <TextField
            label="Facebook URL"
            value={site.social.facebook}
            onChange={(v) => set("social", { ...site.social, facebook: v })}
          />
          <TextField
            label="Instagram URL"
            value={site.social.instagram}
            onChange={(v) => set("social", { ...site.social, instagram: v })}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <TextField
              label="White Logo URL (for dark backgrounds)"
              value={site.logoWhite}
              onChange={(v) => set("logoWhite", v)}
            />
            {site.logoWhite && (
              <div className="mt-2 bg-[#0F3D2E] rounded-lg p-3 relative h-14 w-28">
                <Image src={site.logoWhite} alt="Logo preview" fill className="object-contain" />
              </div>
            )}
          </div>
          <div>
            <TextField label="Icon / Favicon URL" value={site.logoMark} onChange={(v) => set("logoMark", v)} />
            {site.logoMark && (
              <div className="mt-2 bg-[#F6F1E7] rounded-lg p-3 relative h-14 w-14">
                <Image src={site.logoMark} alt="Icon preview" fill className="object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-5 inline-flex items-center gap-2 bg-[#0F3D2E] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1D5C41] transition-colors disabled:opacity-60"
      >
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E3A857]"
      />
    </div>
  );
}
