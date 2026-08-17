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
  title: "JobsOverseas — Advertise the job. Track the hire.",
  description:
    "JobsOverseas is where licensed overseas recruitment agencies post vacancies and candidates apply, directly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={brandFont.variable}>
      <body>{children}</body>
    </html>
  );
}
