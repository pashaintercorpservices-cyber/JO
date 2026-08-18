"use client";

import { useState, useTransition } from "react";
import { resetUserPasswordAction } from "@/lib/actions/admin";

export function ResetPasswordControl({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function close() {
    setOpen(false);
    setPassword("");
    setMessage(null);
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Reset password
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password.length < 8) {
          setMessage({ type: "error", text: "At least 8 characters." });
          return;
        }
        if (!window.confirm(`Set a new password for ${email}? They'll need to use it next time they log in.`)) {
          return;
        }
        startTransition(async () => {
          try {
            await resetUserPasswordAction(userId, password);
            setMessage({ type: "success", text: "Password updated." });
            setTimeout(close, 1500);
          } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed." });
          }
        });
      }}
      style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
    >
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        minLength={8}
        required
        autoFocus
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          fontSize: 13,
          width: 150,
        }}
      />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? "…" : "Save"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={close}>
        Cancel
      </button>
      {message && (
        <span
          style={{
            fontSize: 12,
            color: message.type === "error" ? "var(--danger)" : "var(--success)",
          }}
        >
          {message.text}
        </span>
      )}
    </form>
  );
}
