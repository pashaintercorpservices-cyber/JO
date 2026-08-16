import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdTile } from "@/components/AdTile";
import { BannerCarousel } from "@/components/BannerCarousel";
import { CategoryStrip } from "@/components/CategoryStrip";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("job_ads")
    .select("*")
    .eq("status", "live")
    .order("published_at", { ascending: false });
  if (country) query = query.eq("country", country);
  const { data: ads } = await query;

  return (
    <>
      <section className="hero-slim">
        <div className="wrap">
          <p className="eyebrow">For licensed overseas recruitment agencies</p>
          <h1>
            Advertise the job. <em style={{ fontStyle: "normal", color: "var(--amber-600)" }}>Candidates apply directly.</em>
          </h1>
          <p>
            Every ad below is a real vacancy posted by a registered agency and approved by our
            team — candidates can apply with or without an account.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-primary btn-sm" href="/agency/register">
              Register your agency →
            </Link>
            <Link className="btn btn-ghost btn-sm" href="/apply">
              Apply for a vacancy
            </Link>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="wrap">
          <BannerCarousel />
          <CategoryStrip activeCountry={country} />

          <div className="ads-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div className="section-head" style={{ margin: 0 }}>
              <p className="eyebrow">Live right now{country ? ` · ${country}` : ""}</p>
              <h2>{ads?.length ?? 0} open vacancies</h2>
            </div>
          </div>

          {!ads || ads.length === 0 ? (
            <div className="ad-empty">
              {country ? `No live vacancies in ${country} right now.` : "No live vacancies yet — check back soon."}
            </div>
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
