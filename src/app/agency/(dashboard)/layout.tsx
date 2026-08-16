import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashShell } from "@/components/DashShell";

export default async function AgencyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/agency/login");
  if (user.profile.role !== "agency" && !user.profile.is_super_admin) redirect("/");
  if (!user.agency) redirect("/");

  return (
    <DashShell
      roleTag={user.profile.is_super_admin ? "Agency · Super Admin" : "Agency"}
      navItems={[
        { href: "/agency/dashboard", label: "Dashboard" },
        { href: "/agency/ads/new", label: "Post a new ad" },
        ...(user.profile.is_super_admin ? [{ href: "/admin", label: "Admin console →" }] : []),
      ]}
    >
      {children}
    </DashShell>
  );
}
