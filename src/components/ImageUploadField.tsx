"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUploadField({
  userId,
  imageUrl,
  onImageUrlChange,
}: {
  userId: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
}) {
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
    onImageUrlChange(data.publicUrl);
    setStatus("idle");
  }

  return (
    <div className="field">
      <label htmlFor="ad_image">Ad image / flyer</label>
      <input id="ad_image" type="file" accept="image/*" onChange={handleFile} required={!imageUrl} />
      <span className="hint">
        Every ad is shown as an image on the homepage — upload the recruitment flyer or banner for
        this vacancy.
      </span>
      {status === "uploading" && <span className="hint">Uploading…</span>}
      {status === "error" && <span className="hint">Upload failed — please try again.</span>}
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
