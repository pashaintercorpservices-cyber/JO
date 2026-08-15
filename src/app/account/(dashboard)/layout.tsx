import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashShell } from "@/components/DashShell";

export default async function AccountDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login");
  if (user.profile.role !== "candidate") redirect("/");

  return (
    <DashShell
      roleTag="Jobseeker"
      navItems={[{ href: "/account/applications", label: "My applications" }]}
    >
      {children}
    </DashShell>
  );
}
