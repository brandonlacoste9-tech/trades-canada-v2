import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, TrendingUp, FileText, DollarSign, CheckCircle, ArrowRight, Search, Target, Zap, CalendarDays } from "lucide-react";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { getCityBySlug, getAllCitySlugs } from "@/lib/cityData";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import LeadForm from "@/components/marketing/LeadForm";

interface CityPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};

  const isFr = lang === "fr";
  const cityName = isFr ? city.nameFr : city.name;
  const province = isFr ? city.provinceFr : city.province;

  const title = isFr
    ? `Entrepreneurs de ${cityName} — Génération de Leads & SEO | Trades-Canada`
    : `${cityName} Contractors — Lead Generation & SEO | Trades-Canada`;

  const description = isFr
    ? `Obtenez plus de leads en tant qu'entrepreneur à ${cityName}, ${province}. SEO bilingue, automatisation et génération de leads pour les métiers de ${cityName}.`
    : `Get more leads as a contractor in ${cityName}, ${province}. Bilingual SEO, automation, and lead generation built for ${cityName} trades.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://trades-canada.com/${lang}/city/${slug}`,
      languages: {
        "en-CA": `https://trades-canada.com/en/city/${slug}`,
        "fr-CA": `https://trades-canada.com/fr/city/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: isFr ? "fr_CA" : "en_CA",
    },
  };
}

export async function generateStaticParams() {
  const slugs = getAllCitySlugs();
  const langs = ["en", "fr"];
  return langs.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

const cityFeatures = [
  { icon: Search, en: "Bilingual SEO (EN/FR)", fr: "SEO bilingue (EN/FR)" },
  { icon: Target, en: "AI Lead Targeting", fr: "Ciblage de leads par IA" },
  { icon: Zap, en: "Smart Automation", fr: "Automatisation intelligente" },
  { icon: CalendarDays, en: "Planexa Scheduling", fr: "Planification Planexa" },
];

export default async function CityPage({ params }: CityPageProps) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const l = lang as Lang;
  const cityName = l === "fr" ? city.nameFr : city.name;
  const province = l === "fr" ? city.provinceFr : city.province;
  const description = city.description[l];
  const trades = l === "fr" ? city.tradesFr : city.trades;

  // Structured data for local SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Trades-Canada — ${cityName}`,
    description,
    areaServed: { "@type": "City", name: cityName, containedInPlace: { "@type": "Province", name: province } },
    url: `https://trades-canada.com/${l}/city/${slug}`,
    serviceType: trades,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen flex flex-col">
        <Navbar lang={l} />
        <main className="flex-1 pt-24">
          {/* Hero */}
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-hero-gradient" />
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50" />
            <div className="absolute inset-0 bg-amber-glow-sm" />
            <div className="section-container relative z-10">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge-amber">
                    <MapPin className="w-3.5 h-3.5" />
                    {t("city.badge", l)}
                  </span>
                </div>
                <h1 className="heading-xl mb-6">
                  <span className="text-gradient-amber">{cityName}</span>{" "}
                  <span className="text-foreground">
                    {l === "en" ? "Contractor Leads" : "Leads pour entrepreneurs"}
                  </span>
                </h1>
                <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl leading-relaxed mb-8">
                  {description}
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  {trades.map((trade) => (
                    <span key={trade} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                      {trade}
                    </span>
                  ))}
                </div>
                <Link href={`/${l}/booking`} className="btn-amber text-base px-8 py-4 inline-flex">
                  {t("city.cta", l)} {cityName}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-16 border-t border-b border-white/[0.04]">
            <div className="section-container">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { icon: FileText, label: t("city.permits", l), value: city.stats.permits },
                  { icon: TrendingUp, label: t("city.growth", l), value: city.stats.growth },
                  { icon: DollarSign, label: t("city.avgJob", l), value: city.stats.avgJob },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="stat-card items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="font-display font-bold text-2xl text-gradient-amber">{value}</div>
                    <div className="text-muted-foreground text-xs font-display tracking-wide">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features + Form */}
          <section className="py-20">
            <div className="section-container">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                <div>
                  <h2 className="heading-md mb-6">
                    {l === "en"
                      ? `What We Build for ${cityName} Contractors`
                      : `Ce que nous construisons pour les entrepreneurs de ${cityName}`}
                  </h2>
                  <div className="space-y-4">
                    {cityFeatures.map(({ icon: Icon, en, fr }) => (
                      <div key={en} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-display font-semibold text-sm text-foreground">{l === "fr" ? fr : en}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <LeadForm lang={l} />
              </div>
            </div>
          </section>
        </main>
        <Footer lang={l} />
      </div>
    </>
  );
}
