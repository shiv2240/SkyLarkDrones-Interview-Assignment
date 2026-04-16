import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "6:10 Assistant | Overnight Intelligence Platform",
  description:
    "AI-powered overnight security intelligence for operations leads. Review, validate and brief before 8:00 AM.",
  keywords: ["security operations", "overnight intelligence", "AI briefing", "drone patrol"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
