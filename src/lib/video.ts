import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** video_intro_url on applications stores the storage PATH, not a URL -- generate a
 * fresh signed link on demand, same pattern as resume links. */
export async function getVideoIntroSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("video-intros").createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
