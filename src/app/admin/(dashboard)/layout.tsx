import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashShell } from "@/components/DashShell";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.profile.role !== "admin" && !user.profile.is_super_admin) redirect("/");

  return (
    <DashShell
      roleTag={user.profile.is_super_admin ? "Admin · Super Admin" : "Admin"}
      navItems={[
        { href: "/admin", label: "Agencies" },
        { href: "/admin/ads", label: "Ads" },
        { href: "/admin/applications", label: "Applications" },
        { href: "/admin/payments", label: "Payments" },
        { href: "/admin/reports", label: "Reports" },
        ...(user.profile.is_super_admin
          ? [{ href: "/admin/users", label: "Users" }]
          : []),
        ...(user.profile.is_super_admin && user.agency
          ? [{ href: "/agency/dashboard", label: "Agency dashboard →" }]
          : []),
      ]}
    >
      {children}
    </DashShell>
  );
}
