"use client";

import { useTransition } from "react";

export function AdminActionButton({
  onAction,
  label,
  className = "btn btn-ghost btn-sm",
  confirmMessage,
}: {
  onAction: () => Promise<void>;
  label: string;
  className?: string;
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          await onAction();
        });
      }}
    >
      {pending ? "…" : label}
    </button>
  );
}
