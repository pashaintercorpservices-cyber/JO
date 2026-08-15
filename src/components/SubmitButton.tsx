"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary btn-block",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Please wait…" : children}
    </button>
  );
}
