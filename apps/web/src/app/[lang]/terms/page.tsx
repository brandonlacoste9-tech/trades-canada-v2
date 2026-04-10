import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLang, type Lang } from "@/lib/i18n";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

interface LegalPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "fr" ? "Conditions d'utilisation | Trades-Canada" : "Terms of Service | Trades-Canada",
    description: lang === "fr" 
      ? "Les règles et conditions d'utilisation de la plateforme Trades-Canada."
      : "The rules and conditions for using the Trades-Canada platform.",
  };
}

export default async function TermsPage({ params }: LegalPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar lang={l} />
      <main className="flex-1 pt-32 pb-20">
        <article className="section-container max-w-3xl">
          <h1 className="heading-lg mb-8">
            {l === "en" ? "Terms of Service" : "Conditions d'utilisation"}
          </h1>
          
          <div className="prose prose-invert prose-amber max-w-none">
            <p className="text-muted-foreground mb-6">
              {l === "en" 
                ? "Last Updated: April 10, 2026" 
                : "Dernière mise à jour : 10 avril 2026"}
            </p>

            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "1. Acceptance of Terms" : "1. Acceptation des conditions"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "By accessing or using Trades-Canada, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services."
                  : "En accédant à Trades-Canada ou en l'utilisant, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services."}
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "2. Platform Purpose" : "2. Objectif de la plateforme"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "Trades-Canada provides a marketplace for homeowner leads and contractor growth tools. We do not guarantee the conversion of leads or the quality of contractor work. We act as a technology intermediary."
                  : "Trades-Canada fournit un marché pour les leads de propriétaires et des outils de croissance pour les entrepreneurs. Nous ne garantissons pas la conversion des leads ni la qualité du travail de l'entrepreneur. Nous agissons en tant qu'intermédiaire technologique."}
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "3. Payments and Subscriptions" : "3. Paiements et abonnements"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "Access to premium features and lead unlocks requires a valid subscription. All payments are processed through Stripe. Subscriptions can be managed via the contractor dashboard."
                  : "L'accès aux fonctionnalités premium et aux déblocages de leads nécessite un abonnement valide. Tous les paiements sont traités via Stripe. Les abonnements peuvent être gérés via le tableau de bord de l'entrepreneur."}
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "4. Prohibited Conduct" : "4. Conduite interdite"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "Users may not use the platform for any illegal purpose, attempt to scrape private data outside of provided APIs, or misrepresent their professional credentials."
                  : "Les utilisateurs ne peuvent pas utiliser la plateforme à des fins illégales, tenter de récupérer des données privées en dehors des API fournies, ou faire de fausses déclarations sur leurs titres professionnels."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "5. Termination" : "5. Résiliation"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "We reserve the right to terminate or suspend access to our platform at our sole discretion, without notice, for conduct that we believe violates these Terms of Service."
                  : "Nous nous réservons le droit de résilier ou de suspendre l'accès à notre plateforme à notre seule discrétion, sans préavis, pour toute conduite que nous estimons violer ces conditions d'utilisation."}
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer lang={l} />
    </div>
  );
}
