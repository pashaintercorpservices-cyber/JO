"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResumeUploadField({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [resumePath, setResumePath] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setResumePath("");
      setFileName("");
      onReadyChange(false);
      return;
    }

    setStatus("uploading");
    setResumePath("");
    onReadyChange(false);
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

    setResumePath(path);
    setFileName(file.name);
    setStatus("idle");
    onReadyChange(true);
  }

  return (
    <div className="field">
      <label htmlFor="resume_file">Resume / CV</label>
      <input
        id="resume_file"
        type="file"
        accept=".pdf,.doc,.docx"
        required
        onChange={handleFile}
      />
      {status === "uploading" && <span className="hint">Uploading…</span>}
      {status === "error" && <span className="hint">Upload failed — please choose the file again.</span>}
      {fileName && status === "idle" && <span className="hint">Attached: {fileName}</span>}
      <input type="hidden" name="resume_path" value={resumePath} />
    </div>
  );
}
