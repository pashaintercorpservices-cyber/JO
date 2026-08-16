import { createClient } from "@/lib/supabase/server";
import { getResumeSignedUrl } from "@/lib/resume";
import { formatDate } from "@/lib/format";

export default async function AdminApplicationsPage({
  searchParams,
}: PageProps<"/admin/applications">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select("*, job_ads(title, country, agencies(agency_name))")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: applications } = await query;

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
      <div className="section-head">
        <p className="eyebrow">Admin</p>
        <h1>Applications</h1>
        <p>Every application across the platform, including guest applications.</p>
      </div>

      <form method="get" style={{ marginBottom: 20, display: "flex", gap: 10, maxWidth: 360 }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search name, email or phone"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 9,
            border: "1px solid var(--border)",
          }}
        />
        <button className="btn btn-ghost btn-sm" type="submit">
          Search
        </button>
      </form>

      {!applications || applications.length === 0 ? (
        <div className="empty-state">No applications found.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Agency</th>
                <th>Resume</th>
                <th>Source</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const jobAd = (
                  app as {
                    job_ads?: { title?: string; country?: string; agencies?: { agency_name?: string } };
                  }
                ).job_ads;
                return (
                  <tr key={app.id}>
                    <td>{app.name}</td>
                    <td>{app.email}</td>
                    <td>{app.phone}</td>
                    <td>
                      {app.position_applied}
                      {jobAd?.country ? ` (${jobAd.country})` : ""}
                    </td>
                    <td>{jobAd?.agencies?.agency_name ?? "—"}</td>
                    <td>
                      {resumeLinks.has(app.id) ? (
                        <a href={resumeLinks.get(app.id)} target="_blank" rel="noreferrer" style={{ color: "var(--amber-600)", fontWeight: 700 }}>
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{app.source === "account" ? "Registered" : "Guest"}</td>
                    <td>{formatDate(app.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
