import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function MyApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");

  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("*, job_ads(id, title, country, status)")
    .eq("applicant_profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Jobseeker</p>
        <h1>My applications</h1>
        <p>Applications you submitted while logged in. The agency will contact you directly.</p>
      </div>

      {!applications || applications.length === 0 ? (
        <div className="empty-state">
          You haven&apos;t applied to anything yet.{" "}
          <Link href="/" style={{ color: "var(--amber-600)", fontWeight: 700 }}>
            Browse live vacancies →
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Position</th>
                <th>Country</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.position_applied}</td>
                  <td>{(app as { job_ads?: { country?: string } }).job_ads?.country ?? "—"}</td>
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
