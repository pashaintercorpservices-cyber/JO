import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ApplyForm } from "@/components/ApplyForm";

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: ads } = await supabase
    .from("job_ads")
    .select("id, title, country")
    .eq("status", "live")
    .order("published_at", { ascending: false });

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
            vacancies={ads ?? []}
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
