import { AuthShell } from "@/components/AuthShell";
import { AgencyLoginForm } from "./AgencyLoginForm";

export default async function AgencyLoginPage({
  searchParams,
}: PageProps<"/agency/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/agency/dashboard";
  return (
    <AuthShell
      eyebrow="For licensed overseas recruitment agencies"
      title="Agency login"
      footer={{ text: "New agency?", linkLabel: "Register here", href: "/agency/register" }}
    >
      <AgencyLoginForm next={next} />
    </AuthShell>
  );
}
