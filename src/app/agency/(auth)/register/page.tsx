import { AuthShell } from "@/components/AuthShell";
import { AgencyRegisterForm } from "./AgencyRegisterForm";

export default function AgencyRegisterPage() {
  return (
    <AuthShell
      eyebrow="For licensed overseas recruitment agencies"
      title="Register your agency"
      footer={{ text: "Already registered?", linkLabel: "Log in", href: "/agency/login" }}
    >
      <AgencyRegisterForm />
    </AuthShell>
  );
}
