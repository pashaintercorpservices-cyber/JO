import { AuthShell } from "@/components/AuthShell";
import { AccountLoginForm } from "./AccountLoginForm";

export default async function AccountLoginPage({
  searchParams,
}: PageProps<"/account/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/account/applications";
  return (
    <AuthShell
      eyebrow="Jobseeker account"
      title="Log in"
      footer={{ text: "New here?", linkLabel: "Create an account", href: "/account/register" }}
    >
      <AccountLoginForm next={next} />
    </AuthShell>
  );
}
