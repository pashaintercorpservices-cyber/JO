"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="dash-nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "active" : ""}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
