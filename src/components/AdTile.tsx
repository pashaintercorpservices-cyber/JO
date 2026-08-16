import Link from "next/link";
import type { Tables } from "@/lib/types";
import { timeAgo, COUNTRY_FLAGS } from "@/lib/format";

const GRADIENTS = [
  "linear-gradient(135deg, #0a1f4a, #2c4d94)",
  "linear-gradient(135deg, #0b4d3f, #1f9d5c)",
  "linear-gradient(135deg, #4a2b0a, #c2701c)",
  "linear-gradient(135deg, #221a47, #4a3494)",
  "linear-gradient(135deg, #6e2c14, #d9741a)",
];

function gradientFor(id: string) {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

export function AdTile({ ad }: { ad: Tables<"job_ads"> }) {
  const bg = ad.image_url
    ? { backgroundImage: `url(${ad.image_url})` }
    : { background: gradientFor(ad.id) };

  return (
    <Link className="ad-tile" href={`/ads/${ad.id}`}>
      <div className="ad-tile-img" style={bg}>
        <span className="ad-tile-badge">
          <span className="dot" />
          Live
        </span>
        <span className="ad-tile-flag">{COUNTRY_FLAGS[ad.country] ?? "🌍"}</span>
      </div>
      <div className="ad-tile-body">
        <b>{ad.title}</b>
        <small>
          {ad.employer_name ? `${ad.employer_name} · ` : ""}
          {ad.city ? `${ad.city}, ` : ""}
          {ad.country}
        </small>
        <div className="ad-tile-foot">
          <span className="country">{ad.country}</span>
          <span className="vac">
            {ad.vacancies ? `${ad.vacancies} openings · ` : ""}
            {ad.published_at ? timeAgo(ad.published_at) : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
