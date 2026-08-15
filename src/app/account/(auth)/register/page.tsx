import { AuthShell } from "@/components/AuthShell";
import { AccountRegisterForm } from "./AccountRegisterForm";

export default function AccountRegisterPage() {
  return (
    <AuthShell
      eyebrow="Jobseeker account"
      title="Create your account"
      footer={{ text: "Already have an account?", linkLabel: "Log in", href: "/account/login" }}
    >
      <AccountRegisterForm />
    </AuthShell>
  );
}
