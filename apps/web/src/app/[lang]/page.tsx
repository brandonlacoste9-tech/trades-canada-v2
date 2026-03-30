import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang, type Lang } from "@/lib/i18n";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/marketing/HeroSection";
import FeaturesSection from "@/components/marketing/FeaturesSection";
import ROICalculator from "@/components/marketing/ROICalculator";
import PricingSection from "@/components/marketing/PricingSection";
import LeadForm from "@/components/marketing/LeadForm";
import VideoSection from "@/components/marketing/VideoSection";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";

  return {
    title: isFr
      ? "Trades-Canada — La plateforme #1 de croissance pour entrepreneurs canadiens"
      : "Trades-Canada — Canada's #1 Contractor Growth Platform",
    description: isFr
      ? "La plateforme tout-en-un de génération de leads, radar et marché conçue pour les métiers canadiens. Moteur de leads bilingue EN/FR d'un océan à l'autre."
      : "The all-in-one Lead Generation, Radar, and Marketplace platform built for Canadian Trades. Bilingual EN/FR lead generation engine from coast to coast.",
    alternates: {
      canonical: `https://trades-canada.com/${lang}`,
      languages: {
        "en-CA": "https://trades-canada.com/en",
        "fr-CA": "https://trades-canada.com/fr",
      },
    },
  };
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar lang={l} />
      <main className="flex-1">
        <HeroSection lang={l} />
        <VideoSection lang={l} />
        <FeaturesSection lang={l} />
        <ROICalculator lang={l} />
        <PricingSection lang={l} />

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-glow-sm" />
          <div className="section-container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <div className="section-label w-fit mb-4">
                  {l === "en" ? "Get Started" : "Commencer"}
                </div>
                <h2 className="heading-lg mb-4">
                  {l === "en" ? "Ready to Dominate Your Market?" : "Prêt à dominer votre marché?"}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {l === "en"
                    ? "Join hundreds of Canadian contractors who are growing their businesses with the Trades-Canada engine."
                    : "Rejoignez des centaines d'entrepreneurs canadiens qui développent leur entreprise avec le moteur Trades-Canada."}
                </p>
              </div>
              <LeadForm lang={l} />
            </div>
          </div>
        </section>
      </main>
      <Footer lang={l} />
    </div>
  );
}
