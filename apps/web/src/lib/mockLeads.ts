/**
 * Mock lead data shown to free-tier (unpaid) users.
 * These are realistic-looking demo leads that showcase the platform's
 * capabilities without exposing any real homeowner or permit data.
 */

export interface MockLead {
  id: string;
  title: string;
  source: string;
  location: string;
  projectType: string;
  value: string;
  description: string;
  createdAt: string;
  isUnlocked: false;
  isMock: true;
}

const now = Date.now();
const hour = 3600_000;
const day = 24 * hour;

export function getMockLeads(lang: "en" | "fr"): MockLead[] {
  return [
    {
      id: "mock-001",
      title: lang === "en" ? "Kitchen Renovation — Full Gut" : "Rénovation de cuisine — Complète",
      source: lang === "en" ? "Demo Lead" : "Lead démo",
      location: "Toronto, ON",
      projectType: "renovations",
      value: "$28,000",
      description: lang === "en"
        ? "Homeowner looking for complete kitchen renovation including cabinets, countertops, and flooring."
        : "Propriétaire cherche rénovation complète de cuisine incluant armoires, comptoirs et plancher.",
      createdAt: new Date(now - 2 * hour).toISOString(),
      isUnlocked: false,
      isMock: true,
    },
    {
      id: "mock-002",
      title: lang === "en" ? "Commercial HVAC System Replacement" : "Remplacement de système CVAC commercial",
      source: lang === "en" ? "Demo Lead" : "Lead démo",
      location: "Montréal, QC",
      projectType: "hvac",
      value: "$45,000",
      description: lang === "en"
        ? "Small business owner needs full HVAC upgrade for 3,200 sqft retail space. Urgent timeline."
        : "Propriétaire d'entreprise a besoin d'une mise à niveau CVAC complète pour un espace de 3 200 pi². Délai urgent.",
      createdAt: new Date(now - 5 * hour).toISOString(),
      isUnlocked: false,
      isMock: true,
    },
    {
      id: "mock-003",
      title: lang === "en" ? "Roof Replacement — Asphalt Shingles" : "Remplacement de toiture — Bardeaux d'asphalte",
      source: lang === "en" ? "Demo Lead" : "Lead démo",
      location: "Vancouver, BC",
      projectType: "roofing",
      value: "$18,500",
      description: lang === "en"
        ? "2,400 sqft home needs complete roof tear-off and replacement. Insurance claim in progress."
        : "Maison de 2 400 pi² a besoin d'un remplacement complet de toiture. Réclamation d'assurance en cours.",
      createdAt: new Date(now - 1 * day).toISOString(),
      isUnlocked: false,
      isMock: true,
    },
    {
      id: "mock-004",
      title: lang === "en" ? "Basement Waterproofing + Bathroom Rough-In" : "Imperméabilisation du sous-sol + Plomberie de salle de bain",
      source: lang === "en" ? "Demo Lead" : "Lead démo",
      location: "Ottawa, ON",
      projectType: "plumbing",
      value: "$12,000",
      description: lang === "en"
        ? "Homeowner finishing basement. Needs waterproofing, drainage, and bathroom plumbing rough-in."
        : "Propriétaire finition de sous-sol. Besoin d'imperméabilisation, drainage et plomberie brute de salle de bain.",
      createdAt: new Date(now - 1.5 * day).toISOString(),
      isUnlocked: false,
      isMock: true,
    },
    {
      id: "mock-005",
      title: lang === "en" ? "Full Landscape Design — New Build" : "Aménagement paysager complet — Nouvelle construction",
      source: lang === "en" ? "Demo Lead" : "Lead démo",
      location: "Calgary, AB",
      projectType: "landscaping",
      value: "$35,000",
      description: lang === "en"
        ? "New construction property needs complete landscaping: grading, sod, patio, retaining walls, and irrigation."
        : "Propriété de nouvelle construction a besoin d'aménagement complet : nivellement, gazon, patio, murs de soutien et irrigation.",
      createdAt: new Date(now - 2 * day).toISOString(),
      isUnlocked: false,
      isMock: true,
    },
    {
      id: "mock-006",
      title: lang === "en" ? "200-Amp Electrical Panel Upgrade" : "Mise à jour du panneau électrique 200 ampères",
      source: lang === "en" ? "Demo Lead" : "Lead démo",
      location: "Québec, QC",
      projectType: "electrical",
      value: "$4,500",
      description: lang === "en"
        ? "Older home requires 100A to 200A panel upgrade. Adding EV charger circuit and sub-panel in garage."
        : "Maison ancienne nécessite une mise à jour de panneau de 100A à 200A. Ajout de circuit chargeur VÉ et sous-panneau au garage.",
      createdAt: new Date(now - 3 * day).toISOString(),
      isUnlocked: false,
      isMock: true,
    },
  ];
}
