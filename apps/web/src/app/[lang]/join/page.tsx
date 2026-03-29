import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang, type Lang } from "@/lib/i18n";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import LeadForm from "@/components/marketing/LeadForm";
import { CalendarDays, Clock, CheckCircle, Mail } from "lucide-react";

interface BookingPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "fr" ? "Rejoindre le réseau | Trades-Canada" : "Join the Network | Trades-Canada",
    description: lang === "fr"
      ? "Demandez l'accès au premier réseau de génération de leads pour les professionnels de la construction au Canada."
      : "Request access to Canada's top lead generation network for home service professionals.",
  };
}

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

export default async function JoinPage({ params }: BookingPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const benefits = l === "en"
    ? [
        "Instant access to local market leads",
        "Bilingual lead targeting setup for your city",
        "Real-time Lead Radar & data intelligence",
        "Pay only for the leads you need",
      ]
    : [
        "Accès instantané aux leads du marché local",
        "Configuration du ciblage des leads bilingues",
        "Aperçu du Lead Radar et intelligence des données",
        "Payez seulement pour les leads dont vous avez besoin",
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
                  {l === "en" ? "Network Access" : "Accès au réseau"}
                </div>
                <h1 className="heading-lg mb-4">
                  {l === "en" ? "Let's Scale Your Business" : "Faisons croître votre entreprise"}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {l === "en"
                    ? "Request access to our lead generation platform. Find, track, and buy high-quality leads in your local market without any required phone calls or demos."
                    : "Demandez l'accès à notre plateforme de génération de leads. Trouvez, suivez et achetez des leads de haute qualité dans votre marché local, sans appels téléphoniques obligatoires ni démos."}
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
                        {l === "en" ? "Instant Dashboard Access" : "Accès instantané au tableau de bord"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {l === "en"
                          ? "Browse the marketplace immediately"
                          : "Parcourez le marché immédiatement"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-display font-semibold text-sm text-foreground">
                        {l === "en" ? "Prefer async contact?" : "Préférez un contact asynchrone?"}
                      </p>
                      <a
                        href="mailto:hello@trades-canada.com?subject=Trades-Canada%20Demo%20Request"
                        className="text-amber-400 text-xs hover:text-amber-300 transition-colors"
                      >
                        hello@trades-canada.com
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
