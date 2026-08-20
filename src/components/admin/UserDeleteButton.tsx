"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { deleteUserAction } from "@/lib/actions/admin";

export function UserDeleteButton({ userId, label }: { userId: string; label: string }) {
  return (
    <AdminActionButton
      label="Delete"
      className="btn btn-danger btn-sm"
      confirmMessage={`Permanently delete "${label}"'s account and login? If they're an agency, this also deletes every ad, vacancy, payment, and application tied to them. This cannot be undone.`}
      onAction={() => deleteUserAction(userId)}
    />
  );
}
