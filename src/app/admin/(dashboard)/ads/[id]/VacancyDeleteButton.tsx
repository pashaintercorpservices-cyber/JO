"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { deleteJobVacancyAction } from "@/lib/actions/admin";

export function VacancyDeleteButton({ vacancyId, title }: { vacancyId: string; title: string }) {
  return (
    <AdminActionButton
      label="Delete"
      className="btn btn-danger btn-sm"
      confirmMessage={`Permanently delete the "${title}" vacancy? Existing applications for it are kept but unlinked from this position. This cannot be undone.`}
      onAction={() => deleteJobVacancyAction(vacancyId)}
    />
  );
}
