import type { ResumePreview } from "@/components/ResumeUploadField";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumePreviewCard({ file }: { file: ResumePreview }) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 14,
        marginBottom: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{file.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{formatFileSize(file.size)}</div>
        </div>
        <a
          href={file.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm"
        >
          Open in new tab
        </a>
      </div>

      {isImage && (
        <img
          src={file.previewUrl}
          alt="Resume preview"
          style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 9, border: "1px solid var(--border)" }}
        />
      )}
      {isPdf && (
        <iframe
          src={file.previewUrl}
          title="Resume preview"
          style={{ width: "100%", height: 420, border: "1px solid var(--border)", borderRadius: 9 }}
        />
      )}
      {!isImage && !isPdf && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Preview isn&apos;t available for this file type — use &quot;Open in new tab&quot; to check it&apos;s the
          right document before you submit.
        </p>
      )}
    </div>
  );
}
