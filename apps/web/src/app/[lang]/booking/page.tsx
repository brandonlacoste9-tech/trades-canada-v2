import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import LeadForm from "@/components/marketing/LeadForm";
import { CalendarDays, Clock, CheckCircle, Phone } from "lucide-react";

interface BookingPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "fr" ? "Réserver un appel | Trades-Canada" : "Book a Call | Trades-Canada",
    description: lang === "fr"
      ? "Réservez un appel de stratégie gratuit avec l'équipe Trades-Canada."
      : "Book a free strategy call with the Trades-Canada team.",
  };
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const benefits = l === "en"
    ? [
        "Custom website audit & competitive analysis",
        "Bilingual SEO strategy for your trade & city",
        "ROI projection based on your market",
        "No commitment — just clarity",
      ]
    : [
        "Audit de site web personnalisé et analyse concurrentielle",
        "Stratégie SEO bilingue pour votre métier et votre ville",
        "Projection de ROI basée sur votre marché",
        "Sans engagement — juste de la clarté",
      ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar lang={l} />
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute inset-0 bg-amber-glow-sm" />
          <div className="section-container relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <div className="section-label w-fit mb-4">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {l === "en" ? "Free Strategy Call" : "Appel stratégique gratuit"}
                </div>
                <h1 className="heading-lg mb-4">
                  {l === "en" ? "Let's Build Your Growth Engine" : "Construisons votre moteur de croissance"}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {l === "en"
                    ? "Book a 30-minute strategy call with our team. We'll audit your current digital presence and map out exactly how to dominate your local market."
                    : "Réservez un appel stratégique de 30 minutes avec notre équipe. Nous auditerons votre présence numérique actuelle et cartographierons exactement comment dominer votre marché local."}
                </p>

                <div className="space-y-3 mb-8">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-display font-semibold text-sm text-foreground">
                        {l === "en" ? "30-Minute Strategy Session" : "Session stratégique de 30 minutes"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {l === "en" ? "Via Google Meet or phone" : "Via Google Meet ou téléphone"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Phone className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-display font-semibold text-sm text-foreground">
                        {l === "en" ? "Or call us directly" : "Ou appelez-nous directement"}
                      </p>
                      <a href="tel:+15148001234" className="text-amber-400 text-xs hover:text-amber-300 transition-colors">
                        +1 (514) 800-1234
                      </a>
                    </div>
                  </div>
                </div>
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
