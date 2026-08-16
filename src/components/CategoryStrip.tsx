import Link from "next/link";
import { COUNTRIES, COUNTRY_FLAGS } from "@/lib/format";

export function CategoryStrip({ activeCountry }: { activeCountry?: string }) {
  return (
    <div className="category-strip">
      <Link href="/" className={`category-chip${!activeCountry ? " active" : ""}`}>
        All countries
      </Link>
      {COUNTRIES.filter((c) => c !== "Other").map((c) => (
        <Link
          key={c}
          href={`/?country=${encodeURIComponent(c)}`}
          className={`category-chip${activeCountry === c ? " active" : ""}`}
        >
          <span className="flag">{COUNTRY_FLAGS[c]}</span>
          {c}
        </Link>
      ))}
    </div>
  );
}
