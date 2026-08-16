export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  pending_approval: "Pending approval",
  live: "Live",
  paused: "Paused",
  rejected: "Rejected",
  closed: "Closed",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  pending_payment: "badge-pending",
  pending_approval: "badge-pending",
  live: "badge-live",
  paused: "badge-neutral",
  rejected: "badge-rejected",
  closed: "badge-closed",
};

export const PROMO_LABEL: Record<string, string> = {
  not_started: "Not started",
  scheduled: "Scheduled",
  running: "Running",
  completed: "Completed",
};

export const COUNTRIES = [
  "UAE",
  "Saudi Arabia",
  "Qatar",
  "Oman",
  "Bahrain",
  "Kuwait",
  "Other",
];

export const COUNTRY_FLAGS: Record<string, string> = {
  UAE: "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  Qatar: "🇶🇦",
  Oman: "🇴🇲",
  Bahrain: "🇧🇭",
  Kuwait: "🇰🇼",
  Other: "🌍",
};
