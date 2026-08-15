import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdTile } from "@/components/AdTile";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: ads } = await supabase
    .from("job_ads")
    .select("*")
    .eq("status", "live")
    .order("published_at", { ascending: false });

  return (
    <>
      <section className="hero" style={{ padding: "56px 0" }}>
        <div className="wrap">
          <p className="eyebrow">For licensed overseas recruitment agencies</p>
          <h1 style={{ fontSize: 42, lineHeight: 1.1, margin: "12px 0 16px" }}>
            Advertise the job.
            <br />
            <em style={{ fontStyle: "normal", color: "var(--amber-600)" }}>
              Candidates apply directly.
            </em>
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 480, marginBottom: 28 }}>
            Every ad below is a real vacancy posted by a registered agency and approved by our
            team — candidates can apply with or without an account.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/agency/register">
              Register your agency →
            </Link>
            <Link className="btn btn-ghost" href="/apply">
              Apply for a vacancy
            </Link>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="ads-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div className="section-head" style={{ margin: 0 }}>
              <p className="eyebrow">Live right now</p>
              <h2>{ads?.length ?? 0} open vacancies</h2>
            </div>
          </div>

          {!ads || ads.length === 0 ? (
            <div className="ad-empty">No live vacancies yet — check back soon.</div>
          ) : (
            <div className="ad-grid">
              {ads.map((ad) => (
                <AdTile key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
