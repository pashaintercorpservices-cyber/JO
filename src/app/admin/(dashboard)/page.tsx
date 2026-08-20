import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { AgencyVerifyToggle } from "./AgencyRow";
import { AgencyDeleteButton } from "./AgencyDeleteButton";

export default async function AdminAgenciesPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const canDelete = Boolean(user?.profile.is_super_admin);
  const { data: agencies } = await supabase
    .from("agencies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Admin</p>
        <h1>Agencies</h1>
        <p>Every registered agency. Verify agencies you&apos;ve confirmed hold a valid recruiting license.</p>
      </div>

      {!agencies || agencies.length === 0 ? (
        <div className="empty-state">No agencies registered yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Agency</th>
                <th>Phone</th>
                <th>License no.</th>
                <th>Status</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 700 }}>{a.agency_name}</td>
                  <td>{a.contact_phone || "—"}</td>
                  <td>{a.license_number || "—"}</td>
                  <td>
                    <span className={`badge ${a.verified ? "badge-live" : "badge-pending"}`}>
                      <span className="dot" />
                      {a.verified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td>{formatDate(a.created_at)}</td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <AgencyVerifyToggle agencyId={a.id} verified={a.verified} />
                    {canDelete && (
                      <AgencyDeleteButton profileId={a.profile_id} agencyName={a.agency_name} />
                    )}
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
