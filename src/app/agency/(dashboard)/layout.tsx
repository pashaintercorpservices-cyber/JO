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
  if (user.profile.role !== "agency") redirect("/");

  return (
    <DashShell
      roleTag="Agency"
      navItems={[
        { href: "/agency/dashboard", label: "Dashboard" },
        { href: "/agency/ads/new", label: "Post a new ad" },
      ]}
    >
      {children}
    </DashShell>
  );
}
