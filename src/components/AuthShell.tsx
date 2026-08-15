import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function AuthShell({
  eyebrow,
  title,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  footer?: { text: string; linkLabel: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <section>
        <div className="wrap-narrow">
          <div className="card">
            <p className="eyebrow">{eyebrow}</p>
            <h1 style={{ fontSize: 26, margin: "8px 0 22px" }}>{title}</h1>
            {children}
            {footer && (
              <p style={{ marginTop: 18, fontSize: 13.5, color: "var(--muted)" }}>
                {footer.text}{" "}
                <Link href={footer.href} style={{ color: "var(--amber-600)", fontWeight: 700 }}>
                  {footer.linkLabel}
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
