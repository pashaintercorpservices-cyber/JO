import type { MetadataRoute } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

const BASE_URL = "https://jobsoverseas.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: ads } = await supabase
    .from("job_ads")
    .select("id, published_at")
    .eq("status", "live");

  const adEntries: MetadataRoute.Sitemap = (ads || []).map((ad) => ({
    url: `${BASE_URL}/ads/${ad.id}`,
    lastModified: ad.published_at ? new Date(ad.published_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...adEntries,
  ];
}
