"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { deleteApplicationAction } from "@/lib/actions/admin";

export function ApplicationDeleteButton({ applicationId, name }: { applicationId: string; name: string }) {
  return (
    <AdminActionButton
      label="Delete"
      className="btn btn-danger btn-sm"
      confirmMessage={`Permanently delete ${name}'s application? This cannot be undone.`}
      onAction={() => deleteApplicationAction(applicationId)}
    />
  );
}
