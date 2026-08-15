"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { setAdStatusAction } from "@/lib/actions/admin";

export function AdRowActions({ jobAdId, status }: { jobAdId: string; status: string }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
    </div>
  );
}
