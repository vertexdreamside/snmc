"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { uploadImage } from "@/app/admin/actions";

export default function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImage(formData);
    setUploading(false);
    if (result.success) {
      onChange(result.url);
    } else {
      setError(result.error);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-[#3C4A41] mb-1.5 block">{label}</label>
      <div className="flex gap-3 items-start">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F6F1E7] border border-[#EDE3CE] shrink-0">
          {value && <Image src={value} alt="" fill className="object-cover" />}
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL, or upload a file"
            className="w-full border border-[#C9C2B4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E3A857]"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F3D2E] border border-[#C9C2B4] rounded-full px-3 py-1.5 hover:border-[#E3A857] disabled:opacity-60"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? "Uploading…" : "Upload image"}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
