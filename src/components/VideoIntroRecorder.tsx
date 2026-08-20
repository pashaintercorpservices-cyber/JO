"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type VideoIntroPreview = { previewUrl: string; seconds: number };

function pickMimeType(): string {
  const candidates = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function VideoIntroRecorder({
  onReadyChange,
  onVideoSelected,
}: {
  onReadyChange: (ready: boolean) => void;
  onVideoSelected: (preview: VideoIntroPreview | null) => void;
}) {
  const [lengthSeconds, setLengthSeconds] = useState<60 | 120 | null>(null);
  const [phase, setPhase] = useState<"idle" | "live" | "recording" | "reviewing" | "uploading" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [videoPath, setVideoPath] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef<string>("");
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function startCamera() {
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setPhase("live");
      // Video element mounts this render pass; attach once it's in the DOM.
      setTimeout(() => {
        if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setErrorMessage("Couldn't access your camera/microphone. Check your browser permissions and try again.");
      setPhase("error");
    }
  }

  function startRecording() {
    if (!streamRef.current || !lengthSeconds) return;
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setPhase("reviewing");
      uploadRecording(blob, url);
    };
    recorderRef.current = recorder;
    recorder.start();
    setPhase("recording");
    setElapsed(0);
    onReadyChange(false);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= lengthSeconds) {
          recorder.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  }

  async function uploadRecording(blob: Blob, previewUrl: string) {
    setPhase("uploading");
    const supabase = createClient();
    const token = crypto.randomUUID();
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    const path = `${token}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("video-intros").upload(path, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: blob.type || "video/webm",
    });

    if (error) {
      setErrorMessage("Upload failed. Please try recording again.");
      setPhase("error");
      onReadyChange(false);
      return;
    }

    setVideoPath(path);
    setPhase("reviewing");
    onReadyChange(true);
    onVideoSelected({ previewUrl, seconds: elapsed });

    setTimeout(() => {
      if (playbackVideoRef.current) playbackVideoRef.current.src = previewUrl;
    }, 0);
  }

  function reRecord() {
    setPhase("idle");
    setLengthSeconds(null);
    setVideoPath("");
    setElapsed(0);
    onReadyChange(false);
    onVideoSelected(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }

  return (
    <div className="field">
      <label>Video introduction (required)</label>
      <p className="hint" style={{ marginBottom: 8 }}>
        This agency asks for a short video introduction. Pick 1 or 2 minutes, then record.
      </p>

      {phase === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${lengthSeconds === 60 ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setLengthSeconds(60)}
            >
              1 minute
            </button>
            <button
              type="button"
              className={`btn btn-sm ${lengthSeconds === 120 ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setLengthSeconds(120)}
            >
              2 minutes
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-sm" disabled={!lengthSeconds} onClick={startCamera}>
            Enable camera →
          </button>
        </div>
      )}

      {phase === "error" && (
        <div>
          <p className="hint" style={{ color: "var(--danger)" }}>{errorMessage}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reRecord}>
            Try again
          </button>
        </div>
      )}

      {phase === "live" && (
        <div>
          <video
            ref={liveVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", maxWidth: 360, borderRadius: 9, background: "#000" }}
          />
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={startRecording}>
              ● Start recording ({lengthSeconds === 60 ? "1 min" : "2 min"} max)
            </button>
          </div>
        </div>
      )}

      {phase === "recording" && (
        <div>
          <video
            ref={liveVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", maxWidth: 360, borderRadius: 9, background: "#000" }}
          />
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="hint" style={{ color: "var(--danger)", fontWeight: 700 }}>
              ● REC {elapsed}s / {lengthSeconds}s
            </span>
            <button type="button" className="btn btn-danger btn-sm" onClick={stopRecording}>
              Stop
            </button>
          </div>
        </div>
      )}

      {phase === "uploading" && <span className="hint">Uploading your video…</span>}

      {phase === "reviewing" && (
        <div>
          <video
            ref={playbackVideoRef}
            controls
            playsInline
            style={{ width: "100%", maxWidth: 360, borderRadius: 9, background: "#000" }}
          />
          <div style={{ marginTop: 8 }}>
            {videoPath ? (
              <span className="hint">Video attached ({elapsed}s). </span>
            ) : (
              <span className="hint">Uploading…</span>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={reRecord}>
              Re-record
            </button>
          </div>
        </div>
      )}

      <input type="hidden" name="video_intro_path" value={videoPath} />
      <input type="hidden" name="video_intro_seconds" value={videoPath ? elapsed : ""} />
    </div>
  );
}
