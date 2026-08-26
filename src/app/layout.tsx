import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const brandFont = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jobsoverseas.in"),
  title: {
    default: "JobsOverseas: Overseas Jobs & Gulf Jobs Abroad",
    template: "%s | JobsOverseas",
  },
  description:
    "Find verified overseas jobs and Gulf jobs abroad — live openings in UAE, Saudi Arabia, Qatar, Oman, Kuwait & Bahrain. Browse assignments abroad on JobsOverseas.",
  verification: {
    google: "DEN5VpquEq2CGo2ERtgcebxdBsfXuz1J4sH-Y8U8qzM",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={brandFont.variable}>
      <body>{children}</body>
    </html>
  );
}
