import Link from "next/link";
import { DashNav } from "@/components/DashNav";
import { SignOutButton } from "@/components/SignOutButton";

export function DashShell({
  roleTag,
  navItems,
  children,
}: {
  roleTag: string;
  navItems: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="site">
        <div className="nav-row">
          <Link className="brand" href="/">
            <img src="/logo-icon.png" alt="" className="brand-mark" />
            <span className="brand-name">
              Jobs<span className="o">Overseas</span>
            </span>
          </Link>
        </div>
      </header>
      <div className="dash-shell">
        <aside className="dash-side">
          <span className="role-tag">{roleTag}</span>
          <DashNav items={navItems} />
          <div style={{ marginTop: 20 }}>
            <SignOutButton />
          </div>
        </aside>
        <main className="dash-main">
          <div className="wrap">{children}</div>
        </main>
      </div>
    </>
  );
}
