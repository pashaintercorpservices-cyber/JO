import { AuthShell } from "@/components/AuthShell";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";
  return (
    <AuthShell eyebrow="Platform" title="Admin sign-in">
      <AdminLoginForm next={next} />
    </AuthShell>
  );
}
