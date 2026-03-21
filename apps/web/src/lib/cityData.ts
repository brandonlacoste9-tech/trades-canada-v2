export interface CityData {
  slug: string;
  name: string;
  nameFr: string;
  province: string;
  provinceFr: string;
  population: string;
  description: { en: string; fr: string };
  trades: string[];
  tradesFr: string[];
  stats: { permits: string; growth: string; avgJob: string };
  coordinates: { lat: number; lng: number };
}

export const cities: CityData[] = [
  {
    slug: "toronto",
    name: "Toronto",
    nameFr: "Toronto",
    province: "Ontario",
    provinceFr: "Ontario",
    population: "2.9M",
    description: {
      en: "Canada's largest city is booming with residential renovations, condo builds, and commercial construction. Toronto contractors need a competitive edge to stand out in this massive market.",
      fr: "La plus grande ville du Canada est en plein essor avec des rénovations résidentielles, des constructions de condos et des projets commerciaux. Les entrepreneurs de Toronto ont besoin d'un avantage concurrentiel pour se démarquer.",
    },
    trades: ["HVAC", "Electrical", "Plumbing", "General Contracting", "Roofing"],
    tradesFr: ["CVAC", "Électricité", "Plomberie", "Entrepreneur Général", "Toiture"],
    stats: { permits: "45,000+", growth: "12%", avgJob: "$18,500" },
    coordinates: { lat: 43.6532, lng: -79.3832 },
  },
  {
    slug: "montreal",
    name: "Montreal",
    nameFr: "Montréal",
    province: "Quebec",
    provinceFr: "Québec",
    population: "1.8M",
    description: {
      en: "Montreal's construction market is fueled by massive infrastructure projects, residential renovations, and a bilingual customer base that demands service in both languages.",
      fr: "Le marché de la construction de Montréal est alimenté par d'importants projets d'infrastructure, des rénovations résidentielles et une clientèle bilingue qui exige un service dans les deux langues.",
    },
    trades: ["Renovations", "HVAC", "Electrical", "Plumbing", "General Contracting"],
    tradesFr: ["Rénovations", "CVAC", "Électricité", "Plomberie", "Entrepreneur Général"],
    stats: { permits: "28,000+", growth: "9%", avgJob: "$14,200" },
    coordinates: { lat: 45.5017, lng: -73.5673 },
  },
  {
    slug: "vancouver",
    name: "Vancouver",
    nameFr: "Vancouver",
    province: "British Columbia",
    provinceFr: "Colombie-Britannique",
    population: "2.5M",
    description: {
      en: "Vancouver's premium real estate market drives constant renovation and construction demand. Contractors here command some of the highest rates in Canada.",
      fr: "Le marché immobilier haut de gamme de Vancouver génère une demande constante en rénovation et construction. Les entrepreneurs y commandent certains des tarifs les plus élevés au Canada.",
    },
    trades: ["Renovations", "Roofing", "Landscaping", "HVAC", "Electrical"],
    tradesFr: ["Rénovations", "Toiture", "Aménagement Paysager", "CVAC", "Électricité"],
    stats: { permits: "32,000+", growth: "11%", avgJob: "$22,000" },
    coordinates: { lat: 49.2827, lng: -123.1207 },
  },
  {
    slug: "calgary",
    name: "Calgary",
    nameFr: "Calgary",
    province: "Alberta",
    provinceFr: "Alberta",
    population: "1.4M",
    description: {
      en: "Calgary's energy-driven economy supports a thriving construction sector with high-value residential and commercial projects across the city.",
      fr: "L'économie axée sur l'énergie de Calgary soutient un secteur de la construction florissant avec des projets résidentiels et commerciaux de grande valeur.",
    },
    trades: ["HVAC", "Roofing", "General Contracting", "Electrical", "Plumbing"],
    tradesFr: ["CVAC", "Toiture", "Entrepreneur Général", "Électricité", "Plomberie"],
    stats: { permits: "18,000+", growth: "14%", avgJob: "$16,800" },
    coordinates: { lat: 51.0447, lng: -114.0719 },
  },
  {
    slug: "ottawa",
    name: "Ottawa",
    nameFr: "Ottawa",
    province: "Ontario",
    provinceFr: "Ontario",
    population: "1.0M",
    description: {
      en: "The nation's capital has a thriving renovation market driven by heritage homes and government infrastructure projects. Bilingual contractors in Ottawa have a unique advantage.",
      fr: "La capitale nationale possède un marché de rénovation florissant alimenté par des maisons patrimoniales et des projets d'infrastructure gouvernementaux. Les entrepreneurs bilingues d'Ottawa ont un avantage unique.",
    },
    trades: ["Renovations", "HVAC", "Electrical", "Landscaping", "Plumbing"],
    tradesFr: ["Rénovations", "CVAC", "Électricité", "Aménagement Paysager", "Plomberie"],
    stats: { permits: "12,000+", growth: "8%", avgJob: "$15,200" },
    coordinates: { lat: 45.4215, lng: -75.6972 },
  },
  {
    slug: "edmonton",
    name: "Edmonton",
    nameFr: "Edmonton",
    province: "Alberta",
    provinceFr: "Alberta",
    population: "1.1M",
    description: {
      en: "Edmonton's growing population and infrastructure investment create consistent demand for skilled trades across residential and commercial sectors.",
      fr: "La croissance démographique d'Edmonton et les investissements en infrastructure créent une demande constante pour les métiers qualifiés dans les secteurs résidentiel et commercial.",
    },
    trades: ["HVAC", "General Contracting", "Electrical", "Roofing", "Plumbing"],
    tradesFr: ["CVAC", "Entrepreneur Général", "Électricité", "Toiture", "Plomberie"],
    stats: { permits: "14,000+", growth: "10%", avgJob: "$13,500" },
    coordinates: { lat: 53.5461, lng: -113.4938 },
  },
  {
    slug: "winnipeg",
    name: "Winnipeg",
    nameFr: "Winnipeg",
    province: "Manitoba",
    provinceFr: "Manitoba",
    population: "780K",
    description: {
      en: "Winnipeg's stable economy and growing housing market provide steady work for contractors specializing in renovations and new builds.",
      fr: "L'économie stable de Winnipeg et son marché immobilier en croissance offrent un travail régulier aux entrepreneurs spécialisés dans les rénovations et les nouvelles constructions.",
    },
    trades: ["Renovations", "HVAC", "Roofing", "Electrical", "Plumbing"],
    tradesFr: ["Rénovations", "CVAC", "Toiture", "Électricité", "Plomberie"],
    stats: { permits: "8,500+", growth: "6%", avgJob: "$11,000" },
    coordinates: { lat: 49.8951, lng: -97.1384 },
  },
  {
    slug: "halifax",
    name: "Halifax",
    nameFr: "Halifax",
    province: "Nova Scotia",
    provinceFr: "Nouvelle-Écosse",
    population: "450K",
    description: {
      en: "Halifax is experiencing rapid growth with major infrastructure projects and an influx of new residents driving renovation and construction demand.",
      fr: "Halifax connaît une croissance rapide avec d'importants projets d'infrastructure et un afflux de nouveaux résidents stimulant la demande en rénovation et construction.",
    },
    trades: ["Renovations", "Roofing", "HVAC", "Electrical", "General Contracting"],
    tradesFr: ["Rénovations", "Toiture", "CVAC", "Électricité", "Entrepreneur Général"],
    stats: { permits: "5,200+", growth: "15%", avgJob: "$12,500" },
    coordinates: { lat: 44.6488, lng: -63.5752 },
  },
  {
    slug: "saskatoon",
    name: "Saskatoon",
    nameFr: "Saskatoon",
    province: "Saskatchewan",
    provinceFr: "Saskatchewan",
    population: "320K",
    description: {
      en: "Saskatoon's resource-driven economy and expanding suburbs create consistent demand for residential construction and renovation services.",
      fr: "L'économie axée sur les ressources de Saskatoon et ses banlieues en expansion créent une demande constante pour la construction résidentielle et les services de rénovation.",
    },
    trades: ["HVAC", "Roofing", "Electrical", "Plumbing", "General Contracting"],
    tradesFr: ["CVAC", "Toiture", "Électricité", "Plomberie", "Entrepreneur Général"],
    stats: { permits: "4,800+", growth: "7%", avgJob: "$10,500" },
    coordinates: { lat: 52.1332, lng: -106.6700 },
  },
  {
    slug: "regina",
    name: "Regina",
    nameFr: "Regina",
    province: "Saskatchewan",
    provinceFr: "Saskatchewan",
    population: "230K",
    description: {
      en: "Regina's steady growth and government investment in infrastructure provide reliable opportunities for contractors across all trades.",
      fr: "La croissance régulière de Regina et les investissements gouvernementaux en infrastructure offrent des opportunités fiables aux entrepreneurs de tous les métiers.",
    },
    trades: ["HVAC", "Electrical", "Roofing", "Plumbing", "Renovations"],
    tradesFr: ["CVAC", "Électricité", "Toiture", "Plomberie", "Rénovations"],
    stats: { permits: "3,200+", growth: "5%", avgJob: "$9,800" },
    coordinates: { lat: 50.4452, lng: -104.6189 },
  },
];

export function getCityBySlug(slug: string): CityData | undefined {
  return cities.find((c) => c.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return cities.map((c) => c.slug);
}
