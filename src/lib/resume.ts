import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** resume_url on applications now stores the storage PATH, not a URL -- generate a
 * fresh signed link on demand so access can't outlive its purpose. */
export async function getResumeSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("resumes").createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
