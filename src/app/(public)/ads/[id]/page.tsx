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

  const user = await getCurrentUser();

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
            {ad.vacancies ? ` · ${ad.vacancies} openings` : ""}
          </p>

          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              style={{ width: "100%", borderRadius: "var(--radius)", marginBottom: 20, border: "1px solid var(--border)" }}
            />
          )}

          {ad.description && (
            <div className="card">
              <p style={{ whiteSpace: "pre-wrap" }}>{ad.description}</p>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Apply for this vacancy</h2>
            <ApplyForm
              jobAd={ad}
              prefill={
                user
                  ? {
                      name: user.profile.full_name ?? undefined,
                      email: user.email ?? undefined,
                      phone: user.profile.phone ?? undefined,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
