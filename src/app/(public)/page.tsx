import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { AdTile } from "@/components/AdTile";
import { BannerCarousel } from "@/components/BannerCarousel";
import { CategoryStrip } from "@/components/CategoryStrip";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const supabase = await createClient();

  let ads: Tables<"job_ads">[] = [];

  if (q) {
    // PostgREST's .or() filter syntax treats "," and "()" as structural, so strip them
    // out of the free-text query before interpolating.
    const safeQ = q.replace(/[,()]/g, " ").trim();
    const likeQ = `%${safeQ}%`;
    const [{ data: adMatches }, { data: vacMatches }] = await Promise.all([
      supabase
        .from("job_ads")
        .select("id")
        .eq("status", "live")
        .or(`title.ilike.${likeQ},description.ilike.${likeQ},employer_name.ilike.${likeQ},city.ilike.${likeQ}`),
      supabase
        .from("job_vacancies")
        .select("job_ad_id, job_ads!inner(status)")
        .eq("job_ads.status", "live")
        .or(`title.ilike.${likeQ},details.ilike.${likeQ},city.ilike.${likeQ}`),
    ]);

    const idSet = new Set<string>();
    (adMatches || []).forEach((a) => idSet.add(a.id));
    (vacMatches || []).forEach((v) => idSet.add(v.job_ad_id));
    const ids = [...idSet];

    if (ids.length > 0) {
      let matchQuery = supabase
        .from("job_ads")
        .select("*")
        .eq("status", "live")
        .in("id", ids)
        .order("published_at", { ascending: false });
      if (country) matchQuery = matchQuery.eq("country", country);
      const { data } = await matchQuery;
      ads = data || [];
    }
  } else {
    let query = supabase
      .from("job_ads")
      .select("*")
      .eq("status", "live")
      .order("published_at", { ascending: false });
    if (country) query = query.eq("country", country);
    const { data } = await query;
    ads = data || [];
  }

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

          <form method="get" style={{ display: "flex", gap: 10, marginBottom: 20, maxWidth: 460 }}>
            {country && <input type="hidden" name="country" value={country} />}
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search position, city, employer…"
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 9,
                border: "1px solid var(--border)",
                fontSize: 14.5,
              }}
            />
            <button className="btn btn-primary btn-sm" type="submit">
              Search
            </button>
            {q && (
              <Link className="btn btn-ghost btn-sm" href={country ? `/?country=${country}` : "/"}>
                Clear
              </Link>
            )}
          </form>

          <CategoryStrip activeCountry={country} />

          <div className="ads-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div className="section-head" style={{ margin: 0 }}>
              <p className="eyebrow">
                Live right now{country ? ` · ${country}` : ""}
                {q ? ` · "${q}"` : ""}
              </p>
              <h2>{ads.length} open vacancies</h2>
            </div>
          </div>

          {ads.length === 0 ? (
            <div className="ad-empty">
              {q
                ? `No live vacancies matching "${q}"${country ? ` in ${country}` : ""}.`
                : country
                  ? `No live vacancies in ${country} right now.`
                  : "No live vacancies yet — check back soon."}
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
