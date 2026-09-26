import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Origins Atlas — Community-First Real Estate",
  description:
    "Origins Atlas is a community-first real estate platform. One house, one record — see every listing, agent, and price in one place.",
  keywords: ["real estate", "Thailand", "property", "Bangkok", "Bangna", "Nirvana Absolute"],
  openGraph: {
    title: "Origins Atlas",
    description: "Community-first real estate platform. One house, one record.",
    type: "website",
  },
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
