"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ContentKey } from "@/lib/cms";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated.");
  }
  return { supabase, user };
}

/** Save one section of site content (rooms, services, pricing, etc). */
export async function saveContent(key: ContentKey, value: unknown) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("site_content").upsert({ key, value }, { onConflict: "key" });
  if (error) {
    return { success: false as const, error: error.message };
  }

  // Every public page that could show this section.
  revalidatePath("/", "layout");

  return { success: true as const };
}

/** Upload an image file to the site-images bucket, return its public URL. */
export async function uploadImage(formData: FormData) {
  const { supabase } = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "No file provided." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false as const, error: "Only image files are allowed." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { success: false as const, error: "Image must be under 8MB." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("site-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    return { success: false as const, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("site-images").getPublicUrl(path);

  return { success: true as const, url: publicUrl };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
