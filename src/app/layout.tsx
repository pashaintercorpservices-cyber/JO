import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobOverseas — Advertise the job. Track the hire.",
  description:
    "JobOverseas is where licensed overseas recruitment agencies post vacancies and candidates apply, directly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
