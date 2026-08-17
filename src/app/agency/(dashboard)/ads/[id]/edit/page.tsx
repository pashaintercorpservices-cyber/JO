import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditAdForm } from "./EditAdForm";

export default async function EditAdPage({ params }: PageProps<"/agency/ads/[id]/edit">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !user.agency) redirect("/agency/login");

  const supabase = await createClient();
  const { data: ad } = await supabase.from("job_ads").select("*").eq("id", id).single();
  if (!ad || ad.agency_id !== user.agency.id) notFound();

  const { data: vacancies } = await supabase
    .from("job_vacancies")
    .select("title, country, city, salary_range, vacancies, details")
    .eq("job_ad_id", id)
    .order("created_at", { ascending: true });

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">{ad.country}</p>
        <h1>Edit ad</h1>
        <p>{ad.title}</p>
      </div>
      <div className="card">
        <EditAdForm userId={user.id} ad={ad} vacancies={vacancies || []} />
      </div>
    </>
  );
}
