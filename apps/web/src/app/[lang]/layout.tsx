import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang, type Lang } from "@/lib/i18n";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LangLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";

  return {
    alternates: {
      canonical: `https://trades-canada.com/${lang}`,
      languages: {
        "en-CA": "https://trades-canada.com/en",
        "fr-CA": "https://trades-canada.com/fr",
      },
    },
    openGraph: {
      locale: isFr ? "fr_CA" : "en_CA",
      alternateLocale: isFr ? "en_CA" : "fr_CA",
    },
  };
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!isValidLang(lang)) {
    notFound();
  }

  return (
    <html lang={lang as Lang} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
