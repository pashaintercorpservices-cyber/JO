"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { setAgencyVerifiedAction } from "@/lib/actions/admin";

export function AgencyVerifyToggle({ agencyId, verified }: { agencyId: string; verified: boolean }) {
  return verified ? (
    <AdminActionButton
      label="Suspend"
      className="btn btn-danger btn-sm"
      confirmMessage="Suspend this agency? Their ads stay live but they will no longer be shown as verified."
      onAction={() => setAgencyVerifiedAction(agencyId, false)}
    />
  ) : (
    <AdminActionButton
      label="Verify"
      className="btn btn-primary btn-sm"
      onAction={() => setAgencyVerifiedAction(agencyId, true)}
    />
  );
}
