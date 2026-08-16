"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResumeUploadField() {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [resumeUrl, setResumeUrl] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const token = crypto.randomUUID();
    const path = `${token}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("resumes").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      setStatus("error");
      return;
    }

    const { data } = supabase.storage.from("resumes").getPublicUrl(path);
    setResumeUrl(data.publicUrl);
    setFileName(file.name);
    setStatus("idle");
  }

  return (
    <div className="field">
      <label htmlFor="resume_file">
        Resume / CV <span style={{ fontWeight: 400 }}>(optional — PDF or Word document)</span>
      </label>
      <input
        id="resume_file"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFile}
      />
      {status === "uploading" && <span className="hint">Uploading…</span>}
      {status === "error" && <span className="hint">Upload failed — you can still submit without a resume.</span>}
      {fileName && status === "idle" && <span className="hint">Attached: {fileName}</span>}
      <input type="hidden" name="resume_url" value={resumeUrl} />
    </div>
  );
}
