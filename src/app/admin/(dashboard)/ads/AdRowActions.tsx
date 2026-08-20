"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { setAdStatusAction, markAdPaidManuallyAction, deleteJobAdAction } from "@/lib/actions/admin";

export function AdRowActions({
  jobAdId,
  status,
  canDelete = false,
}: {
  jobAdId: string;
  status: string;
  canDelete?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {status === "pending_payment" && (
        <AdminActionButton
          label="Confirm payment received"
          className="btn btn-primary btn-sm"
          confirmMessage="Confirm this agency paid outside Razorpay (bank transfer, cash, etc.)? This moves the ad to Pending Approval."
          onAction={() => markAdPaidManuallyAction(jobAdId)}
        />
      )}
      {status === "pending_approval" && (
        <>
          <AdminActionButton
            label="Approve"
            className="btn btn-primary btn-sm"
            onAction={() => setAdStatusAction(jobAdId, "live")}
          />
          <AdminActionButton
            label="Reject"
            className="btn btn-danger btn-sm"
            confirmMessage="Reject this ad? The agency will need to contact support."
            onAction={() => setAdStatusAction(jobAdId, "rejected")}
          />
        </>
      )}
      {status === "live" && (
        <AdminActionButton
          label="Pause"
          className="btn btn-ghost btn-sm"
          onAction={() => setAdStatusAction(jobAdId, "paused")}
        />
      )}
      {status === "paused" && (
        <AdminActionButton
          label="Resume"
          className="btn btn-primary btn-sm"
          onAction={() => setAdStatusAction(jobAdId, "live")}
        />
      )}
      {(status === "live" || status === "paused") && (
        <AdminActionButton
          label="Close"
          className="btn btn-danger btn-sm"
          confirmMessage="Close this ad? It will be removed from the homepage."
          onAction={() => setAdStatusAction(jobAdId, "closed")}
        />
      )}
      {canDelete && (
        <AdminActionButton
          label="Delete"
          className="btn btn-danger btn-sm"
          confirmMessage="Permanently delete this ad? This also deletes its vacancies, payment records, and applications. This cannot be undone."
          onAction={() => deleteJobAdAction(jobAdId)}
        />
      )}
    </div>
  );
}
