import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, STATUS_BADGE_CLASS, PROMO_LABEL, formatDate } from "@/lib/format";

export default async function AgencyDashboardPage() {
  const user = await getCurrentUser();
  if (!user || !user.agency) redirect("/agency/login");

  const supabase = await createClient();
  const { data: ads } = await supabase
    .from("job_ads")
    .select("*")
    .eq("agency_id", user.agency.id)
    .order("created_at", { ascending: false });

  const { count: applicationCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .in("job_ad_id", (ads || []).map((a) => a.id));

  const liveCount = (ads || []).filter((a) => a.status === "live").length;

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Agency</p>
        <h1>{user.agency.agency_name}</h1>
        <p>
          {user.agency.verified ? "Verified agency" : "Verification pending with the JobOverseas team"}
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="n">{ads?.length ?? 0}</div>
          <div className="l">Total ads posted</div>
        </div>
        <div className="stat-tile">
          <div className="n">{liveCount}</div>
          <div className="l">Live now</div>
        </div>
        <div className="stat-tile">
          <div className="n">{applicationCount ?? 0}</div>
          <div className="l">Applications received</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 18 }}>Your ads</h2>
        <Link className="btn btn-primary btn-sm" href="/agency/ads/new">
          Post a new ad
        </Link>
      </div>

      {!ads || ads.length === 0 ? (
        <div className="empty-state">You haven&apos;t posted any ads yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Position</th>
                <th>Country</th>
                <th>Status</th>
                <th>FB/IG promo</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id}>
                  <td>
                    <Link href={`/agency/ads/${ad.id}`} style={{ fontWeight: 700 }}>
                      {ad.title}
                    </Link>
                  </td>
                  <td>{ad.country}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE_CLASS[ad.status]}`}>
                      <span className="dot" />
                      {STATUS_LABEL[ad.status]}
                    </span>
                  </td>
                  <td>{PROMO_LABEL[ad.promo_status]}</td>
                  <td>{formatDate(ad.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
