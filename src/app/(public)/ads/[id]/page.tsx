import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ApplyForm } from "@/components/ApplyForm";
import { formatDate } from "@/lib/format";

export default async function AdDetailPage({ params }: PageProps<"/ads/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: ad } = await supabase.from("job_ads").select("*").eq("id", id).single();

  if (!ad || ad.status !== "live") notFound();

  const { data: vacancies } = await supabase
    .from("job_vacancies")
    .select("*")
    .eq("job_ad_id", id)
    .order("created_at", { ascending: true });

  const user = await getCurrentUser();
  const prefill = user
    ? {
        name: user.profile.full_name ?? undefined,
        email: user.email ?? undefined,
        phone: user.profile.phone ?? undefined,
      }
    : undefined;

  const vacancyOptions = (vacancies || []).map((v) => ({
    id: v.id,
    title: v.title,
    country: v.country,
    city: v.city,
    salary_range: v.salary_range,
  }));

  return (
    <section>
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40 }}>
        <div>
          <p className="eyebrow">{ad.country}</p>
          <h1 style={{ fontSize: 32, margin: "8px 0 14px" }}>{ad.title}</h1>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            {ad.employer_name ? `${ad.employer_name} · ` : ""}
            {ad.city ? `${ad.city}, ` : ""}
            {ad.country} · Posted {formatDate(ad.created_at)}
          </p>

          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              style={{ width: "100%", borderRadius: "var(--radius)", marginBottom: 20, border: "1px solid var(--border)" }}
            />
          )}

          {ad.description && (
            <div className="card" style={{ marginBottom: vacancies && vacancies.length > 0 ? 16 : 0 }}>
              <p style={{ whiteSpace: "pre-wrap" }}>{ad.description}</p>
            </div>
          )}

          {vacancies && vacancies.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {vacancies.map((v) => (
                <div key={v.id} className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 8,
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <h3 style={{ fontSize: 18 }}>{v.title}</h3>
                    {v.vacancies && (
                      <span className="badge badge-neutral">
                        <span className="dot" />
                        {v.vacancies} openings
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: v.details ? 10 : 0 }}>
                    {v.city ? `${v.city}, ` : ""}
                    {v.country}
                    {v.salary_range ? ` · ${v.salary_range}` : ""}
                  </p>
                  {v.details && (
                    <p style={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>{v.details}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Apply for this vacancy</h2>
            {vacancyOptions.length === 0 ? (
              <div className="empty-state">
                Applications for this ad are being set up — please check back shortly.
              </div>
            ) : vacancyOptions.length === 1 ? (
              <ApplyForm vacancy={vacancyOptions[0]} prefill={prefill} />
            ) : (
              <ApplyForm vacancies={vacancyOptions} prefill={prefill} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
