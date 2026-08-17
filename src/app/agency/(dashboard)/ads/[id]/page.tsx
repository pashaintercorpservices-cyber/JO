import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getResumeSignedUrl } from "@/lib/resume";
import { STATUS_LABEL, STATUS_BADGE_CLASS, PROMO_LABEL, formatDate } from "@/lib/format";

export default async function AgencyAdDetailPage({
  params,
  searchParams,
}: PageProps<"/agency/ads/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user || !user.agency) redirect("/agency/login");

  const supabase = await createClient();
  const { data: ad } = await supabase.from("job_ads").select("*").eq("id", id).single();
  if (!ad || ad.agency_id !== user.agency.id) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("job_ad_id", id)
    .order("created_at", { ascending: false });

  const resumeLinks = new Map<string, string>();
  await Promise.all(
    (applications || [])
      .filter((a) => a.resume_url)
      .map(async (a) => {
        const url = await getResumeSignedUrl(a.resume_url!);
        if (url) resumeLinks.set(a.id, url);
      })
  );

  return (
    <>
      {sp.paid === "1" && (
        <div className="form-success">
          Payment received. Your ad is now pending admin approval — it will go live on the
          homepage shortly.
        </div>
      )}
      {sp.updated === "1" && <div className="form-success">Ad updated.</div>}

      <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p className="eyebrow">{ad.country}</p>
          <h1>{ad.title}</h1>
          <p>
            {ad.employer_name ? `${ad.employer_name} · ` : ""}
            {ad.city ? `${ad.city}, ` : ""}
            {ad.country} · Posted {formatDate(ad.created_at)}
          </p>
        </div>
        <Link className="btn btn-ghost btn-sm" href={`/agency/ads/${ad.id}/edit`}>
          Edit ad
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>Status</div>
          <span className={`badge ${STATUS_BADGE_CLASS[ad.status]}`} style={{ marginTop: 6 }}>
            <span className="dot" />
            {STATUS_LABEL[ad.status]}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>
            FB / Instagram promotion
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{PROMO_LABEL[ad.promo_status]}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>
            Applications received to
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{ad.contact_email}</div>
        </div>
        {ad.status === "live" && (
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>Public link</div>
            <Link href={`/ads/${ad.id}`} style={{ fontWeight: 700, color: "var(--amber-600)" }}>
              View live ad →
            </Link>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 14 }}>
        Applicants {applications?.length ? `(${applications.length})` : ""}
      </h2>

      {!applications || applications.length === 0 ? (
        <div className="empty-state">No applications yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Applied for</th>
                <th>Resume</th>
                <th>Source</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.name}</td>
                  <td>{app.email}</td>
                  <td>{app.phone}</td>
                  <td>{app.position_applied}</td>
                  <td>
                    {resumeLinks.has(app.id) ? (
                      <a href={resumeLinks.get(app.id)} target="_blank" rel="noreferrer" style={{ color: "var(--amber-600)", fontWeight: 700 }}>
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{app.source === "account" ? "Registered candidate" : "Guest"}</td>
                  <td>{formatDate(app.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
