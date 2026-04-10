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
    title: lang === "fr" ? "Politique de confidentialité | Trades-Canada" : "Privacy Policy | Trades-Canada",
    description: lang === "fr" 
      ? "Comment nous protégeons vos données chez Trades-Canada."
      : "How we protect your data at Trades-Canada.",
  };
}

export default async function PrivacyPage({ params }: LegalPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar lang={l} />
      <main className="flex-1 pt-32 pb-20">
        <article className="section-container max-w-3xl">
          <h1 className="heading-lg mb-8">
            {l === "en" ? "Privacy Policy" : "Politique de confidentialité"}
          </h1>
          
          <div className="prose prose-invert prose-amber max-w-none">
            <p className="text-muted-foreground mb-6">
              {l === "en" 
                ? "Last Updated: April 10, 2026" 
                : "Dernière mise à jour : 10 avril 2026"}
            </p>

            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "1. Information We Collect" : "1. Informations que nous collectons"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "We collect information you provide directly to us when you request access to our platform, create an account, or contact us for support. This may include your name, email address, phone number, and business details."
                  : "Nous collectons les informations que vous nous fournissez directement lorsque vous demandez l'accès à notre plateforme, créez un compte ou nous contactez pour obtenir de l'aide. Cela peut inclure votre nom, votre adresse courriel, votre numéro de téléphone et les détails de votre entreprise."}
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "2. How We Use Your Information" : "2. Comment nous utilisons vos informations"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "We use the information we collect to provide, maintain, and improve our services, including to process lead requests, facilitate contractor connections, and send technical notices and support messages."
                  : "Nous utilisons les informations collectées pour fournir, maintenir et améliorer nos services, notamment pour traiter les demandes de leads, faciliter les connexions entre entrepreneurs et envoyer des avis techniques et des messages d'assistance."}
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "3. Data Security" : "3. Sécurité des données"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access. We use encryption (SSL) for all data in transit."
                  : "Nous prenons des mesures raisonnables pour aider à protéger les informations vous concernant contre la perte, le vol, la mauvaise utilisation et l'accès non autorisé. Nous utilisons le cryptage (SSL) pour toutes les données en transit."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {l === "en" ? "4. Contact Us" : "4. Contactez-nous"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {l === "en"
                  ? "If you have any questions about this Privacy Policy, please contact us at hello@trades-canada.com."
                  : "Si vous avez des questions sur cette politique de confidentialité, veuillez nous contacter à hello@trades-canada.com."}
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer lang={l} />
    </div>
  );
}
