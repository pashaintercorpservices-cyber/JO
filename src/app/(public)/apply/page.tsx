import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ApplyForm } from "@/components/ApplyForm";

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: vacancies } = await supabase
    .from("job_vacancies")
    .select("id, title, country, city, salary_range, job_ads!inner(status)")
    .eq("job_ads.status", "live")
    .order("created_at", { ascending: false });

  const user = await getCurrentUser();

  return (
    <section>
      <div className="wrap-narrow">
        <div className="section-head">
          <p className="eyebrow">Apply for a vacancy</p>
          <h1>Choose a position and apply</h1>
          <p>Pick any live vacancy below — you can apply with or without an account.</p>
        </div>
        <div className="card">
          <ApplyForm
            vacancies={(vacancies || []).map((v) => ({
              id: v.id,
              title: v.title,
              country: v.country,
              city: v.city,
              salary_range: v.salary_range,
            }))}
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
    </section>
  );
}
