export type Lang = "en" | "fr";

export const locales: Lang[] = ["en", "fr"];
export const defaultLocale: Lang = "en";

const translations = {
  en: {
    // Nav
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.bookCall": "Book a Call",
    "nav.login": "Contractor Login",
    "nav.getQuote": "Get a Quote",
    "nav.leadMarketplace": "Claim Leads",

    // Hero
    "hero.badge": "Canada's #1 Contractor Growth Platform",
    "hero.headline1": "We Build the Engine.",
    "hero.headline2": "You Get the Leads.",
    "hero.sub": "The all-in-one Website, SEO, and Automation platform built for Canadian Trades — from coast to coast.",
    "hero.cta1": "Get a Quote",
    "hero.cta2": "See How It Works",
    "hero.stat.leads": "Leads Generated",
    "hero.stat.cities": "Cities Covered",
    "hero.stat.retention": "Client Retention",
    "hero.stat.roi": "Average ROI",

    // Features
    "features.badge": "Platform",
    "features.heading": "Built for Canadian Contractors",
    "features.sub": "Everything you need to dominate your local market — anywhere in Canada.",
    "features.seo.title": "Bilingual SEO (EN/FR)",
    "features.seo.desc": "Rank #1 in your city for your trade in both English and French search results.",
    "features.leads.title": "Nationwide Lead Targeting",
    "features.leads.desc": "AI-powered lead capture targeting homeowners across Canada's major markets.",
    "features.automation.title": "Smart Automation",
    "features.automation.desc": "Automated follow-ups, booking confirmations, and review requests.",
    "features.scheduling.title": "Planexa Scheduling",
    "features.scheduling.desc": "Native booking calendar for site estimates and consultations.",
    "features.radar.title": "Lead Radar Dashboard",
    "features.radar.desc": "Real-time lead tracking, scoring, and market intelligence across all provinces.",
    "features.intel.title": "Market Intelligence",
    "features.intel.desc": "Scraped permit data from Toronto, Vancouver, Calgary, Montreal & more.",

    // ROI
    "roi.badge": "ROI Calculator",
    "roi.heading": "Calculate Your ROI",
    "roi.sub": "See exactly how much revenue our engine can generate for your business.",
    "roi.leadsPerMonth": "Leads Per Month",
    "roi.avgJobPrice": "Avg. Job Price",
    "roi.closeRate": "Close Rate",
    "roi.monthlyRevenue": "Projected Monthly Revenue",
    "roi.annualRevenue": "Projected Annual Revenue",
    "roi.roiLabel": "ROI on Investment",

    // Pricing
    "pricing.badge": "Pricing",
    "pricing.heading": "Choose Your Plan",
    "pricing.sub": "Scale from startup to market dominator.",
    "pricing.month": "/month",
    "pricing.popular": "Most Popular",
    "pricing.cta": "Get Started",
    "pricing.starter.name": "The Web Starter",
    "pricing.engine.name": "The Lead Engine",
    "pricing.dominator.name": "The Market Dominator",

    // Auth
    "auth.login": "Sign In",
    "auth.signup": "Create Account",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.displayName": "Your Name",
    "auth.companyName": "Company Name",
    "auth.forgotPassword": "Forgot password?",
    "auth.resetPassword": "Reset Password",
    "auth.sendReset": "Send Reset Link",
    "auth.backToLogin": "Back to Sign In",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.verifyEmail": "Check your email to verify your account.",
    "auth.invalidCreds": "Invalid credentials.",
    "auth.welcome": "Welcome back!",

    // Dashboard
    "dashboard.title": "Contractor Dashboard",
    "dashboard.leads": "My Leads",
    "dashboard.radar": "Lead Radar",
    "dashboard.marketplace": "Lead Marketplace",
    "dashboard.settings": "Settings",
    "dashboard.automationLog": "Automation Log",
    "dashboard.noActivity": "No activity yet.",
    "dashboard.totalLeads": "Total Leads",
    "dashboard.newLeads": "New This Week",
    "dashboard.converted": "Converted",
    "dashboard.revenue": "Est. Revenue",
    "dashboard.claimLead": "Claim Lead",
    "dashboard.unlockLead": "Unlock Lead",
    "dashboard.claimed": "Claimed",
    "dashboard.heatScore": "Heat Score",
    "dashboard.source": "Source",
    "dashboard.location": "Location",
    "dashboard.noLeads": "No market leads available right now.",
    "dashboard.availableLeads": "Available Leads",
    "dashboard.findWork": "Find Work",
    "dashboard.premiumOnly": "Premium Lead",
    "dashboard.unlockToView": "Unlock to view contact details",

    // Marketplace
    "marketplace.title": "Lead Marketplace",
    "marketplace.subtitle": "Real-time verified trades opportunities across Canada.",
    "marketplace.searchPlaceholder": "Search by city or project...",
    "marketplace.filters": "Filters",
    "marketplace.allCategories": "All Categories",
    "marketplace.stats.newToday": "New Leads Today",
    "marketplace.stats.totalMarket": "Total Est. Value",
    "marketplace.stats.quickUnlock": "Avg. Intake Time",
    "marketplace.stats.premiumLeads": "Available Now",
    "marketplace.plumbing": "Plumbing",
    "marketplace.electrical": "Electrical",
    "marketplace.hvac": "HVAC",
    "marketplace.proposeSource": "Propose a Local Source to Scrape",

    // Settings
    "settings.title": "Account Settings",
    "settings.profile": "Profile",
    "settings.subscription": "Subscription",
    "settings.telegram": "Telegram Alerts",
    "settings.save": "Save Changes",
    "settings.saved": "Changes saved.",
    "settings.phone": "Phone Number",
    "settings.services": "Services Offered",
    "settings.telegram.connect": "Connect Telegram",
    "settings.telegram.connected": "Telegram Connected",
    "settings.telegram.disconnect": "Disconnect",
    "settings.telegram.instructions": "Send this code to our bot to receive instant lead alerts:",
    "settings.telegram.waiting": "Waiting for connection...",
    "settings.plan": "Current Plan",
    "settings.noPlan": "No active subscription.",
    "settings.upgrade": "Upgrade Plan",
    "settings.manage": "Manage Billing",

    // City
    "city.badge": "Local Market",
    "city.cta": "Get Leads in",
    "city.permits": "Active Permits",
    "city.growth": "Market Growth",
    "city.avgJob": "Avg. Job Value",
    "city.notFound": "City Not Found",

    // Footer
    "footer.tagline": "The automation engine for Canada's construction industry.",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved.",
  },
  fr: {
    // Nav
    "nav.features": "Fonctionnalités",
    "nav.pricing": "Tarifs",
    "nav.bookCall": "Réserver un appel",
    "nav.login": "Connexion entrepreneur",
    "nav.getQuote": "Obtenir un devis",
    "nav.leadMarketplace": "Réclamer des leads",

    // Hero
    "hero.badge": "La plateforme #1 de croissance pour entrepreneurs au Canada",
    "hero.headline1": "On construit le moteur.",
    "hero.headline2": "Vous récoltez les leads.",
    "hero.sub": "La plateforme tout-en-un de site web, SEO et automatisation conçue pour les métiers canadiens — d'un océan à l'autre.",
    "hero.cta1": "Obtenir un devis",
    "hero.cta2": "Voir comment ça marche",
    "hero.stat.leads": "Leads générés",
    "hero.stat.cities": "Villes couvertes",
    "hero.stat.retention": "Rétention client",
    "hero.stat.roi": "ROI moyen",

    // Features
    "features.badge": "Plateforme",
    "features.heading": "Conçu pour les entrepreneurs canadiens",
    "features.sub": "Tout ce qu'il vous faut pour dominer votre marché local — partout au Canada.",
    "features.seo.title": "SEO bilingue (EN/FR)",
    "features.seo.desc": "Classez-vous #1 dans votre ville pour votre métier en anglais et en français.",
    "features.leads.title": "Ciblage national de leads",
    "features.leads.desc": "Capture de leads alimentée par l'IA ciblant les propriétaires dans les grands marchés canadiens.",
    "features.automation.title": "Automatisation intelligente",
    "features.automation.desc": "Suivis automatisés, confirmations de réservation et demandes d'avis.",
    "features.scheduling.title": "Planification Planexa",
    "features.scheduling.desc": "Calendrier de réservation natif pour les estimations et consultations sur site.",
    "features.radar.title": "Tableau de bord Lead Radar",
    "features.radar.desc": "Suivi des leads en temps réel, scoring et intelligence de marché dans toutes les provinces.",
    "features.intel.title": "Intelligence de marché",
    "features.intel.desc": "Données de permis extraites de Toronto, Vancouver, Calgary, Montréal et plus.",

    // ROI
    "roi.badge": "Calculateur de ROI",
    "roi.heading": "Calculez votre ROI",
    "roi.sub": "Voyez exactement combien de revenus notre moteur peut générer pour votre entreprise.",
    "roi.leadsPerMonth": "Leads par mois",
    "roi.avgJobPrice": "Prix moyen du contrat",
    "roi.closeRate": "Taux de conversion",
    "roi.monthlyRevenue": "Revenus mensuels projetés",
    "roi.annualRevenue": "Revenus annuels projetés",
    "roi.roiLabel": "ROI sur investissement",

    // Pricing
    "pricing.badge": "Tarifs",
    "pricing.heading": "Choisissez votre plan",
    "pricing.sub": "Évoluez de la startup au dominateur du marché.",
    "pricing.month": "/mois",
    "pricing.popular": "Le plus populaire",
    "pricing.cta": "Commencer",
    "pricing.starter.name": "Le Démarreur Web",
    "pricing.engine.name": "Le Moteur de Leads",
    "pricing.dominator.name": "Le Dominateur de Marché",

    // Auth
    "auth.login": "Se connecter",
    "auth.signup": "Créer un compte",
    "auth.email": "Adresse courriel",
    "auth.password": "Mot de passe",
    "auth.displayName": "Votre nom",
    "auth.companyName": "Nom de l'entreprise",
    "auth.forgotPassword": "Mot de passe oublié?",
    "auth.resetPassword": "Réinitialiser le mot de passe",
    "auth.sendReset": "Envoyer le lien",
    "auth.backToLogin": "Retour à la connexion",
    "auth.noAccount": "Pas encore de compte?",
    "auth.hasAccount": "Déjà un compte?",
    "auth.verifyEmail": "Vérifiez votre courriel pour confirmer votre compte.",
    "auth.invalidCreds": "Identifiants invalides.",
    "auth.welcome": "Bienvenue!",

    // Dashboard
    "dashboard.title": "Tableau de bord entrepreneur",
    "dashboard.leads": "Mes leads",
    "dashboard.radar": "Radar de leads",
    "dashboard.marketplace": "Marché de leads",
    "dashboard.settings": "Paramètres",
    "dashboard.automationLog": "Journal d'automatisation",
    "dashboard.noActivity": "Aucune activité pour l'instant.",
    "dashboard.totalLeads": "Total des leads",
    "dashboard.newLeads": "Nouveaux cette semaine",
    "dashboard.converted": "Convertis",
    "dashboard.revenue": "Revenus estimés",
    "dashboard.claimLead": "Réclamer le lead",
    "dashboard.unlockLead": "Débloquer le lead",
    "dashboard.claimed": "Réclamé",
    "dashboard.heatScore": "Score de chaleur",
    "dashboard.source": "Source",
    "dashboard.location": "Emplacement",
    "dashboard.noLeads": "Aucun lead de marché disponible pour l'instant.",
    "dashboard.availableLeads": "Leads disponibles",
    "dashboard.findWork": "Trouver du travail",
    "dashboard.premiumOnly": "Lead Premium",
    "dashboard.unlockToView": "Débloquer pour voir les détails",

    // Marketplace
    "marketplace.title": "Marché des Leads",
    "marketplace.subtitle": "Opportunités vérifiées en temps réel partout au Canada.",
    "marketplace.searchPlaceholder": "Rechercher par ville ou projet...",
    "marketplace.filters": "Filtres",
    "marketplace.allCategories": "Toutes les catégories",
    "marketplace.stats.newToday": "Nouveaux leads aujourd'hui",
    "marketplace.stats.totalMarket": "Valeur totale est.",
    "marketplace.stats.quickUnlock": "Temps d'admission moy.",
    "marketplace.stats.premiumLeads": "Disponibles maintenant",
    "marketplace.plumbing": "Plomberie",
    "marketplace.electrical": "Électricité",
    "marketplace.hvac": "CVAC",
    "marketplace.proposeSource": "Proposer une source locale à extraire",

    // Settings
    "settings.title": "Paramètres du compte",
    "settings.profile": "Profil",
    "settings.subscription": "Abonnement",
    "settings.telegram": "Alertes Telegram",
    "settings.save": "Sauvegarder",
    "settings.saved": "Modifications sauvegardées.",
    "settings.phone": "Numéro de téléphone",
    "settings.services": "Services offerts",
    "settings.telegram.connect": "Connecter Telegram",
    "settings.telegram.connected": "Telegram connecté",
    "settings.telegram.disconnect": "Déconnecter",
    "settings.telegram.instructions": "Envoyez ce code à notre bot pour recevoir des alertes de leads instantanées:",
    "settings.telegram.waiting": "En attente de connexion...",
    "settings.plan": "Plan actuel",
    "settings.noPlan": "Aucun abonnement actif.",
    "settings.upgrade": "Améliorer le plan",
    "settings.manage": "Gérer la facturation",

    // City
    "city.badge": "Marché local",
    "city.cta": "Obtenir des leads à",
    "city.permits": "Permis actifs",
    "city.growth": "Croissance du marché",
    "city.avgJob": "Valeur moyenne du contrat",
    "city.notFound": "Ville introuvable",

    // Footer
    "footer.tagline": "Le moteur d'automatisation pour l'industrie de la construction au Canada.",
    "footer.contact": "Contact",
    "footer.rights": "Tous droits réservés.",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Lang): string {
  return (translations[lang] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
}

export function isValidLang(lang: string): lang is Lang {
  return locales.includes(lang as Lang);
}

export function useTranslations(lang: Lang) {
  return (key: TranslationKey) => t(key, lang);
}
