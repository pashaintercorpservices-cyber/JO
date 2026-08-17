import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  let cta = (
    <>
      <Link className="btn btn-ghost btn-sm" href="/account/login">
        Candidate login
      </Link>
      <Link className="btn btn-primary btn-sm" href="/agency/register">
        Register your agency
      </Link>
    </>
  );

  if (user?.profile.is_super_admin) {
    cta = (
      <>
        {user.agency && (
          <Link className="btn btn-ghost btn-sm" href="/agency/dashboard">
            Agency dashboard
          </Link>
        )}
        <Link className="btn btn-primary btn-sm" href="/admin">
          Admin console
        </Link>
      </>
    );
  } else if (user?.profile.role === "agency") {
    cta = (
      <Link className="btn btn-primary btn-sm" href="/agency/dashboard">
        Agency dashboard
      </Link>
    );
  } else if (user?.profile.role === "candidate") {
    cta = (
      <Link className="btn btn-primary btn-sm" href="/account/applications">
        My applications
      </Link>
    );
  } else if (user?.profile.role === "admin") {
    cta = (
      <Link className="btn btn-primary btn-sm" href="/admin">
        Admin console
      </Link>
    );
  }

  return (
    <header className="site">
      <div className="nav-row">
        <Link className="brand" href="/">
          <img src="/logo-icon.png" alt="" className="brand-mark" />
          Job<span className="o">Overseas</span>
        </Link>
        <nav className="primary">
          <Link href="/">Live ads</Link>
          <Link href="/apply">Apply for a vacancy</Link>
          <Link href="/agency/register">For agencies</Link>
        </nav>
        <div className="cta-row">{cta}</div>
      </div>
    </header>
  );
}
