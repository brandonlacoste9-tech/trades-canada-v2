import Link from "next/link";
import { MapPin, Mail } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { cities } from "@/lib/cityData";

interface FooterProps {
  lang: Lang;
}

export default function Footer({ lang }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-black/40 backdrop-blur-sm">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <span className="text-black font-bold text-sm font-display">TC</span>
              </div>
              <span className="font-display font-bold text-base tracking-tight">TRADES-CANADA</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {t("footer.tagline", lang)}
            </p>
            <div className="flex items-center gap-2 mt-4 text-muted-foreground text-sm">
              <Mail className="w-4 h-4 text-amber-500/70" />
              <a href="mailto:hello@trades-canada.com" className="hover:text-amber-400 transition-colors">
                hello@trades-canada.com
              </a>
            </div>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              {lang === "en" ? "Cities" : "Villes"}
            </h4>
            <ul className="space-y-2">
              {cities.slice(0, 6).map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/${lang}/city/${city.slug}`}
                    className="text-muted-foreground text-sm hover:text-amber-400 transition-colors"
                  >
                    {lang === "fr" ? city.nameFr : city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4">
              {lang === "en" ? "Platform" : "Plateforme"}
            </h4>
            <ul className="space-y-2">
              {[
                { href: `/${lang}#features`, label: t("nav.features", lang) },
                { href: `/${lang}#pricing`, label: t("nav.pricing", lang) },
                { href: `/${lang}/booking`, label: t("nav.bookCall", lang) },
                { href: `/${lang}/auth`, label: t("nav.login", lang) },
                { href: lang === "en" ? "/fr" : "/en", label: lang === "en" ? "Français" : "English" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground text-sm hover:text-amber-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {year} Trades-Canada.com. {t("footer.rights", lang)}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href={`/${lang}/privacy`} className="hover:text-amber-400 transition-colors">
              {lang === "en" ? "Privacy Policy" : "Politique de confidentialité"}
            </Link>
            <Link href={`/${lang}/terms`} className="hover:text-amber-400 transition-colors">
              {lang === "en" ? "Terms of Service" : "Conditions d'utilisation"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
