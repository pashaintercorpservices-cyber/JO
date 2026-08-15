import { createClient } from "@/lib/supabase/server";
import { formatRupees, daysAgoIso } from "@/lib/format";

const RANGES: Record<string, { label: string; days: number }> = {
  daily: { label: "Daily", days: 1 },
  weekly: { label: "Weekly", days: 7 },
  bimonthly: { label: "Bi-monthly (15d)", days: 15 },
  monthly: { label: "Monthly", days: 30 },
};

export default async function AdminReportsPage({
  searchParams,
}: PageProps<"/admin/reports">) {
  const sp = await searchParams;
  const rangeKey = typeof sp.range === "string" && RANGES[sp.range] ? sp.range : "weekly";
  const range = RANGES[rangeKey];
  const since = daysAgoIso(range.days);

  const supabase = await createClient();

  const [{ data: adsInRange }, { data: paymentsInRange }, { data: applicationsInRange }, { data: allPaidAds }] =
    await Promise.all([
      supabase.from("job_ads").select("id, created_at").gte("created_at", since),
      supabase.from("payments").select("amount_paise, status, created_at").gte("created_at", since),
      supabase.from("applications").select("id, created_at").gte("created_at", since),
      supabase
        .from("job_ads")
        .select("id, agency_id, created_at, published_at")
        .not("published_at", "is", null),
    ]);

  const revenueInRange = (paymentsInRange || [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_paise, 0);

  const turnaroundHours = (allPaidAds || [])
    .filter((a) => a.published_at)
    .map((a) => (new Date(a.published_at!).getTime() - new Date(a.created_at).getTime()) / 36e5);
  const avgTurnaround =
    turnaroundHours.length > 0
      ? turnaroundHours.reduce((s, h) => s + h, 0) / turnaroundHours.length
      : null;

  const adsByAgency = new Map<string, number>();
  for (const a of allPaidAds || []) {
    adsByAgency.set(a.agency_id, (adsByAgency.get(a.agency_id) || 0) + 1);
  }
  const agenciesWithAnAd = adsByAgency.size;
  const agenciesWithRepeat = [...adsByAgency.values()].filter((n) => n > 1).length;
  const repeatRate = agenciesWithAnAd > 0 ? (agenciesWithRepeat / agenciesWithAnAd) * 100 : 0;

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Admin</p>
        <h1>Reports</h1>
        <p>Activity for the selected window, plus platform-wide health metrics.</p>
      </div>

      <div className="range-toggle">
        {Object.entries(RANGES).map(([key, r]) => (
          <a key={key} href={`/admin/reports?range=${key}`} className={key === rangeKey ? "active" : ""}>
            {r.label}
          </a>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="n">{adsInRange?.length ?? 0}</div>
          <div className="l">Ads posted</div>
        </div>
        <div className="stat-tile">
          <div className="n">{applicationsInRange?.length ?? 0}</div>
          <div className="l">Applications received</div>
        </div>
        <div className="stat-tile">
          <div className="n">{formatRupees(revenueInRange)}</div>
          <div className="l">Revenue collected</div>
        </div>
        <div className="stat-tile">
          <div className="n">
            {(paymentsInRange || []).filter((p) => p.status === "paid").length}/
            {paymentsInRange?.length ?? 0}
          </div>
          <div className="l">Payments completed</div>
        </div>
      </div>

      <h2 style={{ fontSize: 16, margin: "8px 0 12px" }}>Platform health (all-time)</h2>
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="n">{avgTurnaround !== null ? `${avgTurnaround.toFixed(1)}h` : "—"}</div>
          <div className="l">Avg. time to go live</div>
        </div>
        <div className="stat-tile">
          <div className="n">{repeatRate.toFixed(0)}%</div>
          <div className="l">Agencies posting a repeat ad</div>
        </div>
      </div>
    </>
  );
}
