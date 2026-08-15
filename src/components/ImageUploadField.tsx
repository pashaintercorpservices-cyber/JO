"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUploadField({ userId }: { userId: string }) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("ad-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      setStatus("error");
      return;
    }

    const { data } = supabase.storage.from("ad-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setStatus("idle");
  }

  return (
    <div className="field">
      <label htmlFor="ad_image">
        Ad image <span style={{ fontWeight: 400 }}>(optional — recruitment flyer or banner)</span>
      </label>
      <input id="ad_image" type="file" accept="image/*" onChange={handleFile} />
      {status === "uploading" && <span className="hint">Uploading…</span>}
      {status === "error" && <span className="hint">Upload failed — you can still post without an image.</span>}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Ad preview"
          style={{ marginTop: 10, maxHeight: 140, borderRadius: 10, border: "1px solid var(--border)" }}
        />
      )}
      <input type="hidden" name="image_url" value={imageUrl} />
    </div>
  );
}
