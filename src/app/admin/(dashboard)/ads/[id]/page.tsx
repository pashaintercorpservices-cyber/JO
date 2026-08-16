import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, STATUS_BADGE_CLASS, PROMO_LABEL, formatDate, formatRupees } from "@/lib/format";
import { AdRowActions } from "../AdRowActions";
import { PromoStatusSelect } from "@/components/admin/PromoStatusSelect";

export default async function AdminAdDetailPage({ params }: PageProps<"/admin/ads/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ad } = await supabase
    .from("job_ads")
    .select("*, agencies(agency_name, contact_phone, verified)")
    .eq("id", id)
    .single();

  if (!ad) notFound();

  const agency = (ad as { agencies?: { agency_name?: string; contact_phone?: string; verified?: boolean } })
    .agencies;

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("job_ad_id", id)
    .order("created_at", { ascending: false });

  const { count: applicationCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("job_ad_id", id);

  const { data: vacancies } = await supabase
    .from("job_vacancies")
    .select("*")
    .eq("job_ad_id", id)
    .order("created_at", { ascending: true });

  const latestPayment = payments?.[0];

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">
          Admin · Ads · {agency?.agency_name ?? "Unknown agency"}
        </p>
        <h1>{ad.title}</h1>
        <p>
          {ad.employer_name ? `${ad.employer_name} · ` : ""}
          {ad.city ? `${ad.city}, ` : ""}
          {ad.country} · Posted {formatDate(ad.created_at)}
          {ad.vacancies ? ` · ${ad.vacancies} openings` : ""}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>Ad status</div>
          <span className={`badge ${STATUS_BADGE_CLASS[ad.status]}`} style={{ marginTop: 6 }}>
            <span className="dot" />
            {STATUS_LABEL[ad.status]}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>Payment</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>
            {latestPayment
              ? `${formatRupees(latestPayment.amount_paise)} — ${latestPayment.status}`
              : "No payment record"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>
            FB / Instagram promotion
          </div>
          {ad.status === "live" || ad.status === "paused" ? (
            <div style={{ marginTop: 4 }}>
              <PromoStatusSelect jobAdId={ad.id} value={ad.promo_status} />
            </div>
          ) : (
            <div style={{ fontWeight: 700, marginTop: 4 }}>{PROMO_LABEL[ad.promo_status]}</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>Applications</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{applicationCount ?? 0}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase" }}>
            Applications go to
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{ad.contact_email}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Actions</h2>
        <AdRowActions jobAdId={ad.id} status={ad.status} />
      </div>

      {ad.image_url && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Ad image</h2>
          <img
            src={ad.image_url}
            alt={ad.title}
            style={{ maxWidth: 340, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
          />
        </div>
      )}

      {ad.description && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Basic details</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{ad.description}</p>
        </div>
      )}

      {vacancies && vacancies.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>
            Vacancies advertised {vacancies.length > 1 ? `(${vacancies.length})` : ""}
          </h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Location</th>
                  <th>Salary</th>
                  <th>Openings</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {vacancies.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700 }}>{v.title}</td>
                    <td>
                      {v.city ? `${v.city}, ` : ""}
                      {v.country}
                    </td>
                    <td>{v.salary_range || "—"}</td>
                    <td>{v.vacancies ?? "—"}</td>
                    <td style={{ whiteSpace: "pre-wrap", maxWidth: 320 }}>{v.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Payment history</h2>
        {!payments || payments.length === 0 ? (
          <div className="empty-state">No payment records for this ad.</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Razorpay order</th>
                  <th>Razorpay payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatRupees(p.amount_paise)}</td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === "paid" ? "badge-live" : p.status === "failed" ? "badge-rejected" : "badge-pending"
                        }`}
                      >
                        <span className="dot" />
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.razorpay_order_id}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.razorpay_payment_id ?? "—"}</td>
                    <td>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
