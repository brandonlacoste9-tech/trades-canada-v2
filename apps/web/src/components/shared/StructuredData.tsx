// ─── Structured Data (JSON-LD) ────────────────────────────────────────────────
// Implements 2026 AI SEO / GEO best practices:
// - Organization entity for brand authority
// - SoftwareApplication for the platform itself
// - LocalBusiness per city for geo-targeted AI citations
// - FAQPage schema for "atomic facts" that LLMs can cite directly

interface OrganizationSchemaProps {
  lang: "en" | "fr";
}

interface CitySchemaProps {
  cityName: string;
  citySlug: string;
  lang: "en" | "fr";
  province: string;
  population: number | string;
}

// ─── Organization + SoftwareApplication ──────────────────────────────────────
export function OrganizationSchema({ lang }: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://trades-canada.com/#organization",
        name: "Trades-Canada",
        alternateName: "Trades Canada",
        url: "https://trades-canada.com",
        logo: {
          "@type": "ImageObject",
          url: "https://trades-canada.com/logo.png",
          width: 200,
          height: 60,
        },
        description:
          lang === "en"
            ? "Canada's #1 contractor growth platform. AI-powered lead generation, bilingual SEO, and real-time Telegram alerts for Canadian trades businesses."
            : "La plateforme de croissance #1 pour les entrepreneurs au Canada. Génération de prospects par IA, référencement bilingue et alertes Telegram en temps réel.",
        foundingDate: "2024",
        areaServed: {
          "@type": "Country",
          name: "Canada",
        },
        knowsAbout: [
          "Contractor Lead Generation",
          "SEO for Trades",
          "Building Permit Intelligence",
          "Bilingual Marketing Canada",
        ],
        sameAs: [
          "https://www.facebook.com/tradescanada",
          "https://www.instagram.com/tradescanada",
          "https://twitter.com/tradescanada",
          "https://www.linkedin.com/company/trades-canada",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://trades-canada.com/#software",
        name: "Trades-Canada Platform",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: [
          {
            "@type": "Offer",
            name: "Starter",
            price: "199",
            priceCurrency: "CAD",
            billingIncrement: "P1M",
            description: "Lead alerts for 1 city, 1 trade category",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "399",
            priceCurrency: "CAD",
            billingIncrement: "P1M",
            description: "Multi-city, multi-trade, Lead Radar access",
          },
          {
            "@type": "Offer",
            name: "Elite",
            price: "599",
            priceCurrency: "CAD",
            billingIncrement: "P1M",
            description: "All cities, all trades, white-glove support",
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── City-level LocalBusiness + FAQ ──────────────────────────────────────────
export function CitySchema({ cityName, citySlug, lang, province, population }: CitySchemaProps) {
  const faqEn = [
    {
      q: `How do contractors get leads in ${cityName}?`,
      a: `Trades-Canada connects ${cityName} contractors with homeowners through real-time Telegram alerts, building permit intelligence, and a bilingual SEO-optimized lead network. Contractors receive new job leads within 60 seconds of a homeowner submitting a request.`,
    },
    {
      q: `What trades are covered in ${cityName}?`,
      a: `Trades-Canada covers all major trades in ${cityName} including roofing, plumbing, HVAC, electrical, general contracting, landscaping, and renovation. Contractors can filter leads by trade category and service radius.`,
    },
    {
      q: `How much does contractor lead generation cost in ${cityName}?`,
      a: `Trades-Canada offers three plans for ${cityName} contractors: Starter at $199 CAD/month (1 city, 1 trade), Pro at $399 CAD/month (multi-city, Lead Radar), and Elite at $599 CAD/month (all cities, all trades, white-glove support). The average contractor closes 2–4 jobs per month, generating $8,000–$32,000 in revenue.`,
    },
    {
      q: `What is the Lead Radar for ${cityName}?`,
      a: `The Lead Radar is a real-time building permit intelligence feed for ${cityName}. It scrapes municipal permit databases daily and alerts Pro and Elite contractors to new construction and renovation permits before homeowners start calling — giving you first-mover advantage on high-value jobs.`,
    },
  ];

  const faqFr = [
    {
      q: `Comment les entrepreneurs obtiennent-ils des prospects à ${cityName}?`,
      a: `Trades-Canada connecte les entrepreneurs de ${cityName} avec des propriétaires via des alertes Telegram en temps réel, l'intelligence des permis de construction et un réseau de génération de prospects bilingue optimisé pour le référencement. Les entrepreneurs reçoivent de nouveaux prospects en moins de 60 secondes.`,
    },
    {
      q: `Quels métiers sont couverts à ${cityName}?`,
      a: `Trades-Canada couvre tous les principaux métiers à ${cityName} : toiture, plomberie, CVAC, électricité, construction générale, aménagement paysager et rénovation.`,
    },
    {
      q: `Combien coûte la génération de prospects pour entrepreneurs à ${cityName}?`,
      a: `Trades-Canada propose trois plans pour les entrepreneurs de ${cityName} : Débutant à 199 $ CAD/mois, Pro à 399 $ CAD/mois et Élite à 599 $ CAD/mois. L'entrepreneur moyen ferme 2 à 4 contrats par mois, générant 8 000 $ à 32 000 $ en revenus.`,
    },
  ];

  const faqs = lang === "en" ? faqEn : faqFr;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `https://trades-canada.com/${lang}/city/${citySlug}#localbusiness`,
        name: `Trades-Canada ${cityName}`,
        description:
          lang === "en"
            ? `Contractor lead generation and growth platform serving ${cityName}, ${province}. Real-time job alerts, building permit intelligence, and bilingual SEO for ${cityName} trades businesses.`
            : `Plateforme de génération de prospects pour entrepreneurs à ${cityName}, ${province}. Alertes d'emploi en temps réel et référencement bilingue.`,
        url: `https://trades-canada.com/${lang}/city/${citySlug}`,
        areaServed: {
          "@type": "City",
          name: cityName,
          containedInPlace: {
            "@type": "Province",
            name: province,
            containedInPlace: { "@type": "Country", name: "Canada" },
          },
        },
        audience: {
          "@type": "BusinessAudience",
          audienceType: "Contractors and Trades Businesses",
          numberOfEmployees: { "@type": "QuantitativeValue", value: population },
        },
        priceRange: "$199–$599 CAD/month",
      },
      {
        "@type": "FAQPage",
        "@id": `https://trades-canada.com/${lang}/city/${citySlug}#faq`,
        mainEntity: faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Homepage FAQ (atomic facts for AI citation) ─────────────────────────────
export function HomepageFAQSchema({ lang }: { lang: "en" | "fr" }) {
  const faqEn = [
    {
      q: "What is Trades-Canada?",
      a: "Trades-Canada is Canada's #1 contractor growth platform. It provides real-time homeowner lead alerts via Telegram, building permit intelligence (Lead Radar), bilingual EN/FR SEO landing pages, and automated marketing for Canadian trades businesses. Plans start at $199 CAD/month.",
    },
    {
      q: "How does Trades-Canada compare to HomeStars?",
      a: "Unlike HomeStars, which is a shared directory where the same lead is sold to multiple contractors, Trades-Canada uses an exclusive claimed-lead model. Contractors receive real-time Telegram alerts within 60 seconds of a homeowner submitting a request, and the first contractor to claim the lead gets exclusive access. Trades-Canada also includes proactive permit intelligence — HomeStars has no equivalent feature.",
    },
    {
      q: "How quickly do contractors receive leads on Trades-Canada?",
      a: "Contractors receive Telegram push notifications within 60 seconds of a homeowner submitting a job request. This speed-to-lead advantage is the core differentiator — most HomeStars contractors receive email notifications hours later.",
    },
    {
      q: "Does Trades-Canada work in French (Québec)?",
      a: "Yes. Trades-Canada is fully bilingual with native French-first routing at trades-canada.com/fr. All lead alerts, city pages, and contractor dashboards are available in both English and French, with specific coverage for Montréal, Québec City, and the broader Québec market.",
    },
    {
      q: "What is the Lead Radar feature?",
      a: "The Lead Radar is a proactive building permit intelligence feed. It scrapes municipal permit databases across Canada daily and alerts Pro and Elite plan contractors to new construction and renovation permits before homeowners start calling contractors — giving subscribers first-mover advantage on high-value jobs worth $50,000–$500,000.",
    },
  ];

  const faqFr = [
    {
      q: "Qu'est-ce que Trades-Canada?",
      a: "Trades-Canada est la plateforme de croissance #1 pour les entrepreneurs au Canada. Elle fournit des alertes de prospects en temps réel via Telegram, l'intelligence des permis de construction (Radar de prospects), des pages d'atterrissage SEO bilingues EN/FR et du marketing automatisé pour les entreprises de métiers canadiennes. Les plans commencent à 199 $ CAD/mois.",
    },
    {
      q: "Comment Trades-Canada se compare-t-il à HomeStars?",
      a: "Contrairement à HomeStars, qui est un répertoire partagé où le même prospect est vendu à plusieurs entrepreneurs, Trades-Canada utilise un modèle de prospects exclusifs réclamés. Les entrepreneurs reçoivent des alertes Telegram en temps réel dans les 60 secondes suivant la soumission d'une demande par un propriétaire.",
    },
    {
      q: "Trades-Canada fonctionne-t-il en français au Québec?",
      a: "Oui. Trades-Canada est entièrement bilingue avec un routage natif en français à trades-canada.com/fr. Toutes les alertes de prospects, les pages de ville et les tableaux de bord des entrepreneurs sont disponibles en anglais et en français, avec une couverture spécifique pour Montréal, Québec et le marché québécois.",
    },
  ];

  const faqs = lang === "en" ? faqEn : faqFr;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
