import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, STATUS_BADGE_CLASS, formatDate } from "@/lib/format";
import { AdRowActions } from "./AdRowActions";
import { PromoStatusSelect } from "@/components/admin/PromoStatusSelect";

export default async function AdminAdsPage() {
  const supabase = await createClient();
  const { data: ads } = await supabase
    .from("job_ads")
    .select("*, agencies(agency_name)")
    .order("created_at", { ascending: false });

  const pending = (ads || []).filter((a) => a.status === "pending_approval");
  const rest = (ads || []).filter((a) => a.status !== "pending_approval");

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Admin</p>
        <h1>Ads</h1>
        <p>Approve paid ads before they appear on the homepage, and manage live listings.</p>
      </div>

      {pending.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Pending approval ({pending.length})</h2>
          <div className="table-wrap" style={{ marginBottom: 28 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Agency</th>
                  <th>Country</th>
                  <th>Posted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((ad) => (
                  <tr key={ad.id}>
                    <td style={{ fontWeight: 700 }}>
                      <Link href={`/admin/ads/${ad.id}`} style={{ color: "var(--amber-600)" }}>
                        {ad.title}
                      </Link>
                    </td>
                    <td>{(ad as { agencies?: { agency_name?: string } }).agencies?.agency_name}</td>
                    <td>{ad.country}</td>
                    <td>{formatDate(ad.created_at)}</td>
                    <td>
                      <AdRowActions jobAdId={ad.id} status={ad.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>All ads</h2>
      {rest.length === 0 ? (
        <div className="empty-state">No other ads.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Position</th>
                <th>Agency</th>
                <th>Country</th>
                <th>Status</th>
                <th>FB/IG promo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rest.map((ad) => (
                <tr key={ad.id}>
                  <td style={{ fontWeight: 700 }}>
                    <Link href={`/admin/ads/${ad.id}`} style={{ color: "var(--amber-600)" }}>
                      {ad.title}
                    </Link>
                  </td>
                  <td>{(ad as { agencies?: { agency_name?: string } }).agencies?.agency_name}</td>
                  <td>{ad.country}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE_CLASS[ad.status]}`}>
                      <span className="dot" />
                      {STATUS_LABEL[ad.status]}
                    </span>
                  </td>
                  <td>
                    {ad.status === "live" || ad.status === "paused" ? (
                      <PromoStatusSelect jobAdId={ad.id} value={ad.promo_status} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <AdRowActions jobAdId={ad.id} status={ad.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
