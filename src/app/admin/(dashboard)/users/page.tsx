import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import { ResetPasswordControl } from "@/components/admin/ResetPasswordControl";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  agency: "Agency",
  candidate: "Candidate",
};

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/admin/login");
  if (!currentUser.profile.is_super_admin) redirect("/admin");

  // Service-role client: emails live in auth.users, not the profiles table, and
  // resetting a password requires the Auth Admin API regardless. This page is
  // already gated to super admins above -- that check is the real security
  // boundary here, not RLS.
  const admin = createAdminClient();

  const [{ data: authUsers }, { data: profiles }, { data: agencies }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("agencies").select("profile_id, agency_name"),
  ]);

  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? "—"]));
  const agencyNameByProfileId = new Map((agencies ?? []).map((a) => [a.profile_id, a.agency_name]));

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? "—",
    fullName: p.full_name,
    role: p.role,
    isSuperAdmin: p.is_super_admin,
    agencyName: agencyNameByProfileId.get(p.id) ?? null,
    createdAt: p.created_at,
  }));

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Admin · Super Admin</p>
        <h1>Users</h1>
        <p>Every account on the platform. Reset a password here if someone gets locked out.</p>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">No users yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>
                    {u.fullName || u.agencyName || "—"}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge badge-neutral">
                      <span className="dot" />
                      {ROLE_LABEL[u.role] ?? u.role}
                      {u.isSuperAdmin ? " · Super Admin" : ""}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <ResetPasswordControl userId={u.id} email={u.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
