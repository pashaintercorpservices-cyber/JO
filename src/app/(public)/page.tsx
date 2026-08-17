import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { AdTile } from "@/components/AdTile";
import { BannerCarousel } from "@/components/BannerCarousel";
import { COUNTRIES, COUNTRY_FLAGS } from "@/lib/format";

const POPULAR_SEARCHES = ["Welder", "Electrician", "Driver", "HVAC Technician", "Nurse", "Site Supervisor"];

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

  // Real, unfiltered counts for the country tiles -- honest numbers only, no placeholders.
  const { data: liveAdsForCounts } = await supabase
    .from("job_ads")
    .select("country")
    .eq("status", "live");
  const countryCounts = new Map<string, number>();
  (liveAdsForCounts || []).forEach((a) => {
    countryCounts.set(a.country, (countryCounts.get(a.country) || 0) + 1);
  });
  const countriesWithAds = COUNTRIES.filter((c) => c !== "Other" && countryCounts.has(c));

  return (
    <>
      <section className="hero-rich">
        <div className="wrap">
          <div className="hero-rich-text">
            <p className="eyebrow">For candidates</p>
            <h1>
              Find your next job <em>abroad</em>
            </h1>
            <p>
              Every ad below is a real vacancy posted by a registered agency and reviewed by our
              team — apply directly, with or without an account.
            </p>
            <Link className="hero-agency-link" href="/agency/register">
              Are you a recruitment agency? Post a vacancy →
            </Link>
          </div>
          <div className="hero-rich-promo">
            <img
              src="/gcc-manpower-ad.png"
              alt="GCC Manpower Intelligence Platform — coming soon"
              className="promo-banner-img"
            />
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="hero-search-card">
          <form method="get" className="hero-search-row">
            <input type="text" name="q" defaultValue={q} placeholder="Job title, skill or keyword" />
            <select name="country" defaultValue={country ?? ""}>
              <option value="">All countries</option>
              {COUNTRIES.filter((c) => c !== "Other").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>
          <div className="popular-searches">
            <span>Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link key={term} href={`/?q=${encodeURIComponent(term)}`}>
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section style={{ paddingTop: 20, paddingBottom: 0 }}>
        <div className="wrap">
          <div className="trust-strip">
            <div className="trust-item">
              <div className="ico">✓</div>
              <div>
                <h4>Reviewed before going live</h4>
                <p>Every ad is checked by our team before it appears on the site.</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="ico">→</div>
              <div>
                <h4>Apply directly</h4>
                <p>No recruitment agents in between — your details go straight to the agency.</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="ico">☎</div>
              <div>
                <h4>Hiring manager contact shared</h4>
                <p>Get a confirmation email with a direct contact so you can follow up yourself.</p>
              </div>
            </div>
            <div className="trust-item">
              <div className="ico">＋</div>
              <div>
                <h4>No account required</h4>
                <p>Apply as a guest, or register to track your applications over time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="wrap">
          <BannerCarousel />

          <div className="ads-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div className="section-head" style={{ margin: 0 }}>
              <p className="eyebrow">
                Live right now{country ? ` · ${country}` : ""}
                {q ? ` · "${q}"` : ""}
              </p>
              <h2>{ads.length} open vacancies</h2>
            </div>
            {(country || q) && (
              <Link className="btn btn-ghost btn-sm" href="/">
                Clear filters
              </Link>
            )}
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

          {countriesWithAds.length > 0 && (
            <>
              <div className="section-head" style={{ marginBottom: 16, marginTop: 40, maxWidth: "none" }}>
                <p className="eyebrow">Browse by country</p>
                <h2 style={{ fontSize: 22 }}>Where we&apos;re hiring right now</h2>
              </div>
              <div className="country-tile-grid">
                {countriesWithAds.map((c) => (
                  <Link key={c} href={`/?country=${encodeURIComponent(c)}`} className="country-tile">
                    <span className="flag">{COUNTRY_FLAGS[c]}</span>
                    <b>{c}</b>
                    <span>
                      {countryCounts.get(c)} live ad{countryCounts.get(c) === 1 ? "" : "s"}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="hiring-banner">
            <div>
              <h3>Are you a recruitment agency?</h3>
              <p>Reach candidates directly — post your vacancy and we&apos;ll review it fast.</p>
            </div>
            <Link className="btn btn-primary" href="/agency/register">
              Post a job →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
