import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_LABEL, STATUS_BADGE_CLASS, formatDate } from "@/lib/format";
import { AdRowActions } from "./AdRowActions";
import { PromoStatusSelect } from "@/components/admin/PromoStatusSelect";

export default async function AdminAdsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const canDelete = Boolean(user?.profile.is_super_admin);
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
            <table className="data table-flexible">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Position</th>
                  <th style={{ width: "20%" }}>Agency</th>
                  <th style={{ width: "12%" }}>Country</th>
                  <th style={{ width: "12%" }}>Posted</th>
                  <th style={{ width: "26%" }}></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((ad) => (
                  <tr key={ad.id}>
                    <td style={{ fontWeight: 700 }}>
                      <Link
                        href={`/admin/ads/${ad.id}`}
                        title={ad.title}
                        style={{
                          color: "var(--amber-600)",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ad.title}
                      </Link>
                    </td>
                    <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(ad as { agencies?: { agency_name?: string } }).agencies?.agency_name}
                    </td>
                    <td>{ad.country}</td>
                    <td>{formatDate(ad.created_at)}</td>
                    <td>
                      <AdRowActions jobAdId={ad.id} status={ad.status} canDelete={canDelete} />
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
          <table className="data table-flexible">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Position</th>
                <th style={{ width: "17%" }}>Agency</th>
                <th style={{ width: "10%" }}>Country</th>
                <th style={{ width: "11%" }}>Status</th>
                <th style={{ width: "13%" }}>FB/IG promo</th>
                <th style={{ width: "25%" }}></th>
              </tr>
            </thead>
            <tbody>
              {rest.map((ad) => (
                <tr key={ad.id}>
                  <td style={{ fontWeight: 700 }}>
                    <Link
                      href={`/admin/ads/${ad.id}`}
                      title={ad.title}
                      style={{
                        color: "var(--amber-600)",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ad.title}
                    </Link>
                  </td>
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(ad as { agencies?: { agency_name?: string } }).agencies?.agency_name}
                  </td>
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
                    <AdRowActions jobAdId={ad.id} status={ad.status} canDelete={canDelete} />
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
