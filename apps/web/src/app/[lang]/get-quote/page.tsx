import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, MapPin, Phone, ShieldCheck } from "lucide-react";
import { isValidLang, type Lang } from "@/lib/i18n";
import { getAllCitySlugs, getCityBySlug } from "@/lib/cityData";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import LeadForm from "@/components/marketing/LeadForm";

interface GetQuotePageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: GetQuotePageProps): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr
      ? "Soumissions gratuites — entrepreneurs au Canada | Trades-Canada"
      : "Free Contractor Quotes Across Canada | Trades-Canada",
    description: isFr
      ? "Obtenez des soumissions gratuites de plombiers, électriciens, toiture et rénovation. Formulaires rapides — entrepreneurs locaux licenciés."
      : "Get free quotes from plumbers, electricians, roofers & renovators. Fast form — local licensed contractors call you.",
    alternates: {
      canonical: `https://trades-canada.com/${lang}/get-quote`,
    },
  };
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

export default async function GetQuotePage({ params }: GetQuotePageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const cities = getAllCitySlugs()
    .map((slug) => getCityBySlug(slug))
    .filter(Boolean)
    .slice(0, 12);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar lang={l} />
      <main className="flex-1 pt-24">
        <section className="relative py-16 sm:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute inset-0 bg-amber-glow-sm" />
          <div className="section-container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">
              <div>
                <div className="section-label w-fit mb-4">
                  <Phone className="w-3.5 h-3.5" />
                  {l === "en" ? "Free for homeowners" : "Gratuit pour les propriétaires"}
                </div>
                <h1 className="heading-lg mb-4">
                  {l === "en"
                    ? "Get free contractor quotes"
                    : "Obtenez des soumissions gratuites"}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {l === "en"
                    ? "Describe your project once. Matched local trades contact you with quotes — no obligation."
                    : "Décrivez votre projet une fois. Des métiers locaux vous contactent — sans engagement."}
                </p>
                <ul className="space-y-3 mb-10">
                  {(l === "en"
                    ? [
                        "Licensed local contractors only",
                        "Usually contacted within hours",
                        "Plumbing, electrical, roofing, HVAC, renovations & more",
                      ]
                    : [
                        "Entrepreneurs locaux licenciés seulement",
                        "Contact souvent en quelques heures",
                        "Plomberie, électricité, toiture, CVAC, rénovations et plus",
                      ]
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                      <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {l === "en"
                      ? "Your contact is shared only with matched contractors on the Trades-Canada network."
                      : "Vos coordonnées sont partagées seulement avec des entrepreneurs jumelés sur le réseau Trades-Canada."}
                  </p>
                </div>
              </div>

              <LeadForm lang={l} variant="homeowner" />
            </div>

            {/* City deep links for SEO / local ads */}
            <div className="max-w-5xl mx-auto mt-16">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 text-center">
                {l === "en" ? "Popular cities" : "Villes populaires"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {cities.map((city) => {
                  if (!city) return null;
                  const name = l === "fr" ? city.nameFr : city.name;
                  return (
                    <Link
                      key={city.slug}
                      href={`/${l}/city/${city.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border/60 bg-muted/10 hover:border-amber-500/40 hover:text-amber-400 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer lang={l} />
    </div>
  );
}
