import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang, type Lang } from "@/lib/i18n";
import { OrganizationSchema, TradesServiceSchema, HomepageFAQSchema } from "@/components/shared/StructuredData";
import LangHtmlSetter from "@/components/shared/LangHtmlSetter";

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

  const l = lang as Lang;

  return (
    <>
      {/* Dynamically update <html lang="…"> without nesting a second html element */}
      <LangHtmlSetter lang={l} />
      {/* AI SEO: Organization entity — tells LLMs exactly what this brand is */}
      <OrganizationSchema lang={l} />
      {/* AI SEO: Service & FAQ schemas for GEO (Generative Engine Optimization) */}
      <TradesServiceSchema lang={l} />
      <HomepageFAQSchema lang={l} />
      {children}
    </>
  );
}
