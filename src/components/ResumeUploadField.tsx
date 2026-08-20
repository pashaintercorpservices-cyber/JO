"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ResumePreview = {
  name: string;
  size: number;
  type: string;
  previewUrl: string;
};

export function ResumeUploadField({
  onReadyChange,
  onFileSelected,
}: {
  onReadyChange: (ready: boolean) => void;
  onFileSelected: (preview: ResumePreview | null) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [resumePath, setResumePath] = useState("");
  const [fileName, setFileName] = useState("");
  const previewUrlRef = useRef<string>("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const file = e.target.files?.[0];
    if (!file) {
      setResumePath("");
      setFileName("");
      previewUrlRef.current = "";
      onReadyChange(false);
      onFileSelected(null);
      return;
    }

    // Local object URL for the preview step -- doesn't need the upload to finish.
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    onFileSelected({ name: file.name, size: file.size, type: file.type, previewUrl });

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
      {fileName?.toLowerCase().endsWith(".doc") && status === "idle" && (
        <span className="hint">Note: old .doc files can't be auto-scored against the job — a PDF or .docx works best.</span>
      )}
      <input type="hidden" name="resume_path" value={resumePath} />
    </div>
  );
}
