"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { deleteUserAction } from "@/lib/actions/admin";

export function AgencyDeleteButton({ profileId, agencyName }: { profileId: string; agencyName: string }) {
  return (
    <AdminActionButton
      label="Delete"
      className="btn btn-danger btn-sm"
      confirmMessage={`Permanently delete "${agencyName}" and its login? This also deletes every ad, vacancy, payment, and application tied to this agency. This cannot be undone.`}
      onAction={() => deleteUserAction(profileId)}
    />
  );
}
