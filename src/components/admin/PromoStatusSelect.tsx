"use client";

import { useTransition } from "react";
import { setPromoStatusAction } from "@/lib/actions/admin";
import { PROMO_LABEL } from "@/lib/format";
import type { Database } from "@/lib/types";

type PromoStatus = Database["public"]["Enums"]["promo_status"];

const OPTIONS: PromoStatus[] = ["not_started", "scheduled", "running", "completed"];

export function PromoStatusSelect({ jobAdId, value }: { jobAdId: string; value: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as PromoStatus;
        startTransition(async () => {
          await setPromoStatusAction(jobAdId, next);
        });
      }}
      style={{ fontSize: 12.5, padding: "5px 8px", borderRadius: 7 }}
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {PROMO_LABEL[o]}
        </option>
      ))}
    </select>
  );
}
