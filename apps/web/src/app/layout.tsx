import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trades-canada.com"),
  title: {
    default: "Trades-Canada — Canada's #1 Contractor Growth Platform",
    template: "%s | Trades-Canada",
  },
  description:
    "The all-in-one Website, SEO, and Automation platform built for Canadian Trades — from coast to coast. Bilingual EN/FR lead generation engine.",
  keywords: ["contractor leads Canada", "SEO for contractors", "Canadian trades marketing", "lead generation contractors"],
  openGraph: {
    type: "website",
    locale: "en_CA",
    alternateLocale: "fr_CA",
    siteName: "Trades-Canada",
  },
  twitter: {
    card: "summary_large_image",
    site: "@tradescanada",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
