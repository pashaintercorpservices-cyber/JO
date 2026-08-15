import { createClient } from "@/lib/supabase/server";
import { formatRupees, formatDate } from "@/lib/format";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, agencies(agency_name), job_ads(title)")
    .order("created_at", { ascending: false })
    .limit(200);

  const totalPaid = (payments || [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_paise, 0);

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Admin</p>
        <h1>Payments</h1>
        <p>All ad-posting payments. Total collected: {formatRupees(totalPaid)}.</p>
      </div>

      {!payments || payments.length === 0 ? (
        <div className="empty-state">No payments yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Agency</th>
                <th>Ad</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Razorpay order</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const agency = (p as { agencies?: { agency_name?: string } }).agencies;
                const ad = (p as { job_ads?: { title?: string } }).job_ads;
                return (
                  <tr key={p.id}>
                    <td>{agency?.agency_name ?? "—"}</td>
                    <td>{ad?.title ?? "—"}</td>
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
                    <td>{formatDate(p.created_at)}</td>
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
