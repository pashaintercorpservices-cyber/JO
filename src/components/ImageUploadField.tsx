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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB — well under Supabase's gateway limit
    if (file.size > MAX_SIZE) {
      setErrorMessage(
        `This file is ${(file.size / (1024 * 1024)).toFixed(1)}MB — please use an image under 20MB.`
      );
      setStatus("error");
      e.target.value = "";
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("ad-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        console.error("Ad image upload failed:", error);
        setErrorMessage(error.message || "Unknown error");
        setStatus("error");
        return;
      }

      const { data } = supabase.storage.from("ad-images").getPublicUrl(path);
      onImageUrlChange(data.publicUrl);
      setStatus("idle");
    } catch (err) {
      console.error("Ad image upload threw:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error — check your connection.");
      setStatus("error");
    }
  }

  return (
    <div className="field">
      <label htmlFor="ad_image">Ad image / flyer</label>
      <input id="ad_image" type="file" accept="image/*" onChange={handleFile} required={!imageUrl} />
      <span className="hint">
        Every ad is shown as an image on the homepage — upload the recruitment flyer or banner for
        this vacancy. Recommended size: 1080 × 1080px (square) or 1080 × 1350px (portrait) —
        the same format typically used for WhatsApp flyers. JPG or PNG.
      </span>
      {status === "uploading" && <span className="hint">Uploading…</span>}
      {status === "error" && (
        <span className="hint" style={{ color: "var(--danger, #c0342c)" }}>
          Upload failed{errorMessage ? `: ${errorMessage}` : ""} — please try again.
        </span>
      )}
      {imageUrl && (
        <div
          style={{
            marginTop: 10,
            width: 180,
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            overflow: "hidden",
          }}
        >
          <img
            src={imageUrl}
            alt="Ad preview"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      )}
      <input type="hidden" name="image_url" value={imageUrl} />
    </div>
  );
}
