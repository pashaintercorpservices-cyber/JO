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
  if (user.profile.role !== "admin") redirect("/");

  return (
    <DashShell
      roleTag="Admin"
      navItems={[
        { href: "/admin", label: "Agencies" },
        { href: "/admin/ads", label: "Ads" },
        { href: "/admin/applications", label: "Applications" },
        { href: "/admin/payments", label: "Payments" },
        { href: "/admin/reports", label: "Reports" },
      ]}
    >
      {children}
    </DashShell>
  );
}
