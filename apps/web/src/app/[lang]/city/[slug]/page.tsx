import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  TrendingUp,
  FileText,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Phone,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { getCityBySlug, getAllCitySlugs } from "@/lib/cityData";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import LeadForm from "@/components/marketing/LeadForm";
import { CitySchema } from "@/components/shared/StructuredData";

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

  // Homeowner-intent SEO (ads + organic) — not contractor SaaS copy
  const title = isFr
    ? `Soumissions gratuites — entrepreneurs à ${cityName}, ${province} | Trades-Canada`
    : `Free Contractor Quotes in ${cityName}, ${province} | Trades-Canada`;

  const description = isFr
    ? `Obtenez des soumissions gratuites de plombiers, électriciens, toiture et rénovation à ${cityName}. Formulaires rapides — entrepreneurs locaux licenciés vous appellent.`
    : `Get free quotes from plumbers, electricians, roofers & renovators in ${cityName}. Fast form — local licensed contractors call you back.`;

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

const trustPoints = [
  {
    icon: Phone,
    en: "Local contractors call you",
    fr: "Des entrepreneurs locaux vous appellent",
  },
  {
    icon: Clock,
    en: "Usually same-day response",
    fr: "Réponse souvent le jour même",
  },
  {
    icon: ShieldCheck,
    en: "Free for homeowners — no obligation",
    fr: "Gratuit pour les propriétaires — sans engagement",
  },
];

export default async function CityPage({ params }: CityPageProps) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const l = lang as Lang;
  const cityName = l === "fr" ? city.nameFr : city.name;
  const province = l === "fr" ? city.provinceFr : city.province;
  const trades = l === "fr" ? city.tradesFr : city.trades;

  return (
    <>
      <CitySchema
        cityName={cityName}
        citySlug={slug}
        lang={l}
        province={province}
        population={city.population ?? 500000}
      />
      <div className="min-h-screen flex flex-col">
        <Navbar lang={l} />
        <main className="flex-1 pt-24">
          {/* Homeowner hero — form above the fold on desktop */}
          <section className="relative py-16 sm:py-20 overflow-hidden">
            <div className="absolute inset-0 bg-hero-gradient" />
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50" />
            <div className="absolute inset-0 bg-amber-glow-sm" />
            <div className="section-container relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start max-w-6xl mx-auto">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="badge-amber">
                      <MapPin className="w-3.5 h-3.5" />
                      {cityName}, {province}
                    </span>
                  </div>
                  <h1 className="heading-xl mb-6">
                    {l === "en" ? (
                      <>
                        Free contractor quotes in{" "}
                        <span className="text-gradient-amber">{cityName}</span>
                      </>
                    ) : (
                      <>
                        Soumissions gratuites à{" "}
                        <span className="text-gradient-amber">{cityName}</span>
                      </>
                    )}
                  </h1>
                  <p className="text-muted-foreground text-lg sm:text-xl max-w-xl leading-relaxed mb-8">
                    {l === "en"
                      ? `Need a plumber, electrician, roofer, or renovator in ${cityName}? Submit once — matched local trades contact you with quotes.`
                      : `Besoin d'un plombier, électricien, couvreur ou rénovateur à ${cityName}? Une demande — des métiers locaux vous contactent.`}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {trades.map((trade) => (
                      <span
                        key={trade}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-muted-foreground"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                        {trade}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-3 mb-8">
                    {trustPoints.map(({ icon: Icon, en, fr }) => (
                      <div key={en} className="flex items-center gap-3 text-sm text-foreground/90">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-amber-400" />
                        </div>
                        {l === "fr" ? fr : en}
                      </div>
                    ))}
                  </div>
                  <a
                    href="#get-quote"
                    className="btn-amber text-base px-8 py-4 inline-flex lg:hidden"
                  >
                    {l === "en" ? "Get free quotes" : "Obtenir des soumissions"}
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>

                {/* Primary conversion: homeowner form with city pre-set */}
                <LeadForm lang={l} city={cityName} variant="homeowner" />
              </div>
            </div>
          </section>

          {/* Light social proof / market stats */}
          <section className="py-14 border-t border-b border-white/[0.04]">
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

          {/* Contractor secondary CTA — not the primary path for ads */}
          <section className="py-16">
            <div className="section-container max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                {l === "en" ? "For contractors" : "Pour les entrepreneurs"}
              </p>
              <h2 className="heading-md mb-4">
                {l === "en"
                  ? `Run jobs in ${cityName}?`
                  : `Vous travaillez à ${cityName}?`}
              </h2>
              <p className="text-muted-foreground mb-6">
                {l === "en"
                  ? "Claim exclusive homeowner contacts and municipal permit radar for your trade."
                  : "Réclamez des contacts propriétaires exclusifs et le radar de permis pour votre métier."}
              </p>
              <Link href={`/${l}/join`} className="btn-outline-amber inline-flex">
                {l === "en" ? "Join as a contractor" : "Joindre comme entrepreneur"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </main>
        <Footer lang={l} />
      </div>
    </>
  );
}
